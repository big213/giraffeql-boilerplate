import { getNestedProperty } from '~/services/base'

export default {
  props: {
    item: {
      type: Object,
      required: true,
    },

    renderFieldDefinition: {
      required: true,
      type: Object,
    },

    // where is this column displayed? null | 'crud' | 'view' | 'preview'
    displayMode: {
      type: String,
    },
  },

  computed: {
    options() {
      return this.renderFieldDefinition.renderDefinition.renderOptions
    },

    currentValue() {
      // use a defined pathPrefix, else use the fieldKey, else null
      const pathPrefix =
        this.renderFieldDefinition.renderDefinition.pathPrefix === undefined
          ? this.renderFieldDefinition.fieldKey
          : this.renderFieldDefinition.renderDefinition.pathPrefix

      return pathPrefix ? getNestedProperty(this.item, pathPrefix) : this.item
    },
  },

  methods: {
    getNestedProperty,
  },
}
