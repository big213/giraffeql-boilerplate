import { getNestedProperty } from '~/services/base'

export default {
  props: {
    item: {
      type: Object,
      required: true,
    },
    // could have dot notation for nested properties
    fieldPath: {
      type: String,
    },
    // special options that will be passed to the column component, if any. ** may be undefined **
    options: {
      type: Object,
    },

    // where is this column displayed? null | 'crud' | 'view'
    displayMode: {
      type: String,
    },
  },

  computed: {
    currentValue() {
      return this.fieldPath
        ? getNestedProperty(this.item, this.fieldPath)
        : this.item
    },
  },

  methods: {
    getNestedProperty,

    setColumnValue(value) {
      const fieldParts = this.fieldPath.split('.')
      if (fieldParts.length === 1) {
        this.item[fieldParts[0]] = value
      } else {
        const lastField = fieldParts.pop()
        getNestedProperty(this.item, fieldParts.join('.'))[lastField] = value
      }
    },
  },
}
