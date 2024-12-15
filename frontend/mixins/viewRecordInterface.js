import { executeGiraffeql } from '~/services/giraffeql'
import {
  getNestedProperty,
  handleError,
  capitalizeString,
  serializeNestedProperty,
  lookupFieldInfo,
  processQuery,
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

    recordInfo: {
      type: Object,
      required: true,
    },

    // custom fields that will override add/edit/view options on recordInfo
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
      return capitalizeString(this.recordInfo.typename)
    },

    fields() {
      if (this.customFields) return this.customFields

      return this.recordInfo.viewOptions.fields
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

        const tableOptionsHideIf = inputObject.fieldInfo.tableOptions?.hideIf

        if (tableOptionsHideIf) {
          return !tableOptionsHideIf(inputObject.value, this.currentItem)
        }

        return true
      })
    },

    heroComponent() {
      return this.recordInfo.viewOptions.heroOptions?.component ?? Hero
    },
  },

  watch: {
    generation() {
      this.reset()
    },

    resetInstruction(val) {
      this.reset(val)
    },

    recordInfo() {
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
      // if type of refresh is not defined or 'edit', refresh
      if (
        this.recordInfo.typename === typename &&
        (!refreshType || refreshType === 'edit')
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

    openEditItemDialog(item, editFields) {
      this.$root.$emit('openEditRecordDialog', {
        recordInfo: this.recordInfo,
        selectedItem: item,
        mode: 'edit',
        customFields: editFields,
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

        const { query, serializeMap } = await processQuery(
          this,
          this.recordInfo,
          fields
            .concat(this.recordInfo.requiredFields ?? [])
            .concat(this.recordInfo.viewOptions.requiredFields ?? [])
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

        // remove any undefined serializeMap elements
        serializeMap.forEach((val, key) => {
          if (val === undefined) serializeMap.delete(key)
        })

        // apply serialization to results
        serializeMap.forEach((serialzeFn, field) => {
          serializeNestedProperty(data, field, serialzeFn)
        })

        // run any custom onSuccess functions
        const onSuccess = this.recordInfo.viewOptions.onSuccess

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

            const fieldInfo = lookupFieldInfo(this.recordInfo, fieldKey)

            const fieldValue = fieldInfo.hidden
              ? null
              : getNestedProperty(data, fieldKey)

            const inputObject = {
              field: fieldInfo.fields ? fieldInfo.fields[0] : fieldKey,
              fieldInfo,
              value: fieldValue, // already serialized
              options: [],
              readonly: true,
              generation: 0,
              verticalMode:
                fieldInfo.tableOptions?.verticalView ??
                (typeof fieldElement === 'string'
                  ? false
                  : fieldElement.verticalMode ?? false),
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
