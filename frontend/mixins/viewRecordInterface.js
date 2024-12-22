import { executeGiraffeql } from '~/services/giraffeql'
import {
  getNestedProperty,
  handleError,
  capitalizeString,
  serializeNestedProperty,
  lookupRenderField,
  processQuery,
  camelCaseToCapitalizedString,
} from '~/services/base'
import CircularLoader from '~/components/common/circularLoader.vue'
import Hero from '~/components/interface/crud/hero/hero.vue'
import { logAnalyticsEvent } from '~/services/analytics'

export default {
  components: {
    CircularLoader,
  },

  data() {
    return {
      loading: {
        loadRecord: false,
      },

      resetCalledOnTick: false,

      currentItem: null,

      inputsArray: [],
    }
  },

  props: {
    selectedItem: {
      type: Object,
      required: true,
    },

    viewDefinition: {
      type: Object,
      required: true,
    },

    // custom fields that will override add/edit/view options on viewDefinition
    customFields: {
      type: Array,
    },

    // must be view only
    mode: {
      type: String,
      required: true,
      validator: (value) => {
        return ['view'].includes(value)
      },
    },

    // in dialog mode, some changes are made in the component, like max-height
    dialogMode: {
      type: Boolean,
      default: false,
    },

    generation: {
      type: Number,
      default: 0,
    },

    // expecting object with showLoader? property
    resetInstruction: {
      type: Object,
    },
  },

  computed: {
    isLoading() {
      return this.loading.loadRecord
    },

    capitalizedType() {
      return capitalizeString(this.viewDefinition.entity.typename)
    },

    fields() {
      if (this.customFields) return this.customFields

      return this.viewDefinition.viewOptions.fields
    },

    visibleInputsArray() {
      // if hideIf is specified, check if the input should be visible
      return this.inputsArray.filter((inputObject) => {
        const hideIf = inputObject.hideIf

        if (hideIf) {
          return !hideIf(
            this,
            inputObject.value,
            this.currentItem,
            this.inputsArray
          )
        }

        return true
      })
    },

    heroComponent() {
      return this.viewDefinition.viewOptions.heroOptions?.component ?? Hero
    },
  },

  watch: {
    generation() {
      this.reset()
    },

    resetInstruction(val) {
      this.reset(val)
    },

    viewDefinition() {
      this.reset()
    },
  },

  created() {
    this.reset()

    this.$root.$on('refresh-interface', this.refreshCb)
  },

  destroyed() {
    this.$root.$off('refresh-interface', this.refreshCb)
  },

  methods: {
    getNestedProperty,

    refreshCb(typename, { refreshType } = {}) {
      // if type of refresh is not defined or 'update', refresh
      if (
        this.viewDefinition.entity.typename === typename &&
        (!refreshType || refreshType === 'update')
      ) {
        this.reset()
      }
    },

    getFieldPath(inputObject) {
      const primaryField = inputObject.fieldInfo.fields
        ? inputObject.fieldInfo.fields[0]
        : inputObject.field

      return (
        inputObject.fieldInfo.pathPrefix ??
        (inputObject.fieldInfo.fields && inputObject.fieldInfo.fields.length > 1
          ? null
          : primaryField)
      )
    },

    openEditItemDialog(item, updateFields) {
      this.$root.$emit('openEditRecordDialog', {
        viewDefinition: this.viewDefinition,
        selectedItem: item,
        mode: 'update',
        customFields: updateFields,
      })
    },

    handleItemUpdated() {
      this.$emit('item-updated')
      this.reset()
    },

    async loadRecord(showLoader = true) {
      if (showLoader) this.loading.loadRecord = true
      try {
        const fields = this.fields.map((fieldElement) =>
          typeof fieldElement === 'string' ? fieldElement : fieldElement.field
        )

        const { query } = await processQuery(
          this,
          this.viewDefinition,
          fields
            .concat(this.viewDefinition.requiredFields ?? [])
            .concat(this.viewDefinition.viewOptions.requiredFields ?? []),
          true
        )
        const data = await executeGiraffeql({
          [`get${this.capitalizedType}`]: {
            ...query,
            __args: {
              id: this.selectedItem.id,
            },
          },
        })

        // save record
        this.currentItem = data

        // run any custom onSuccess functions
        const onSuccess = this.viewDefinition.viewOptions.onSuccess

        if (onSuccess) {
          onSuccess(this, data)
        }

        // build inputs Array
        this.inputsArray = await Promise.all(
          this.fields.map((fieldElement) => {
            const fieldKey =
              typeof fieldElement === 'string'
                ? fieldElement
                : fieldElement.field

            const fieldInfo = lookupRenderField(this.viewDefinition, fieldKey)

            const fieldValue = fieldInfo.hidden
              ? null
              : getNestedProperty(data, fieldKey)

            const inputObject = {
              label: fieldInfo.text ?? camelCaseToCapitalizedString(fieldKey),
              field: fieldInfo.fields ? fieldInfo.fields[0] : fieldKey,
              fieldInfo,
              value: fieldValue, // already serialized
              options: [],
              readonly: true,
              generation: 0,
              verticalMode:
                typeof fieldElement === 'string'
                  ? false
                  : fieldElement.verticalMode ?? false,
              hideIf:
                typeof fieldElement === 'string'
                  ? undefined
                  : fieldElement.hideIf,
            }

            return inputObject
          })
        )
      } catch (err) {
        handleError(this, err)
      }
      if (showLoader) this.loading.loadRecord = false
    },

    reset({ showLoader = true } = {}) {
      // if reset was already called on this tick, stop execution
      if (this.resetCalledOnTick) return

      // indicate that reset was called on this tick
      this.resetCalledOnTick = true

      // reset the indicator on the next tick
      this.$nextTick(() => {
        this.resetCalledOnTick = false
      })

      this.loadRecord(showLoader)

      logAnalyticsEvent('record_viewed')
    },
  },
}
