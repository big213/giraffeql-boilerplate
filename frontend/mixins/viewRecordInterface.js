import CircularLoader from '~/components/common/circularLoader.vue'
import Hero from '~/components/interface/crud/hero/hero.vue'
import FieldColumn from '~/components/interface/render/fieldColumn.vue'
import { logAnalyticsEvent } from '~/services/analytics'
import { executeApiRequest } from '~/services/api'
import {
  camelCaseToCapitalizedString,
  getNestedProperty,
  handleError,
  processRenderDefinitions,
  processRenderQuery,
} from '~/services/base'

export default {
  components: {
    CircularLoader,
    FieldColumn,
  },

  data() {
    return {
      loading: {
        loadRecord: false,
      },

      resetCalledOnTick: false,

      currentItem: null,

      renderFieldsArray: [],
    }
  },

  props: {
    parentItem: {
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

    // override options, otherwise will use viewDefinition.viewOptions
    overrideOptions: {},

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

    options() {
      return this.overrideOptions ?? this.viewDefinition.viewOptions
    },

    fields() {
      if (this.customFields) return this.customFields

      return this.options.fields
    },

    visibleRenderFieldsArray() {
      // if hideIf is specified, check if the render field should be visible
      return this.renderFieldsArray.filter(
        (viewObject) =>
          !viewObject.hideIf?.(
            this,
            viewObject.value,
            this.currentItem,
            this.renderFieldsArray
          )
      )
    },

    heroComponent() {
      return this.options.heroOptions?.component ?? Hero
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

    openEditItemDialog(item, fieldKeys) {
      this.$root.$emit('openEditRecordDialog', {
        viewDefinition: this.viewDefinition,
        parentItem: item,
        mode: 'update',
        customFields: fieldKeys,
      })
    },

    async loadRecord(showLoader = true) {
      if (showLoader) this.loading.loadRecord = true
      try {
        const renderFieldDefinitions = processRenderDefinitions(
          this.viewDefinition,
          this.fields
        )

        const query = await processRenderQuery(this, {
          renderFieldDefinitions,
          rawFields: [
            ...(this.viewDefinition.requiredFields ?? []),
            ...(this.options.requiredFields ?? []),
          ],
        })
        const data = await executeApiRequest({
          [`${this.viewDefinition.entity.typename}Get`]: {
            ...query,
            __args: {
              id: this.parentItem.id,
            },
          },
        })

        // save record
        this.currentItem = data

        // run any custom onSuccess functions
        const onSuccess = this.options.onSuccess

        if (onSuccess) {
          onSuccess(this, this.parentItem, data)
        }

        // build render fields Array
        this.renderFieldsArray = await Promise.all(
          renderFieldDefinitions.map((renderFieldDefinition) => {
            const viewObject = {
              fieldKey: renderFieldDefinition.fieldKey,
              text:
                renderFieldDefinition.renderDefinition.text ??
                camelCaseToCapitalizedString(renderFieldDefinition.fieldKey),
              renderDefinition: renderFieldDefinition.renderDefinition,
              value: getNestedProperty(data, renderFieldDefinition.fieldKey),
              readonly: true,
              generation: 0,
              verticalMode: renderFieldDefinition.verticalMode ?? false,
              hideIf: renderFieldDefinition.hideIf,
            }

            return viewObject
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
