<template>
  <div v-if="currentRecord">
    <PreviewRecordMenu
      :item="currentRecord"
      :typename="currentRecord.__typename"
      :close-on-content-click="false"
      :min-width="300"
      :max-width="300"
      offset-y
      top
      open-mode="openInDialog"
    ></PreviewRecordMenu>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'
import { getNestedProperty } from '~/services/base'

export default {
  components: {
    PreviewRecordMenu,
  },

  mixins: [columnMixin],

  // options.fields should be a list of the possible truthy values

  computed: {
    currentRecord() {
      if (!Array.isArray(this.options.fields)) return null

      for (const fieldPath of this.options.fields) {
        const value = getNestedProperty(this.currentValue, fieldPath)

        if (value) return value
      }

      return null
    },
  },
}
</script>
