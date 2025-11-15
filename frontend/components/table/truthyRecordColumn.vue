<template>
  <div v-if="currentFieldObject">
    <component
      v-if="currentFieldObject.component && currentFieldObject.value"
      :is="currentFieldObject.component"
      :value="currentFieldObject.value"
      small
    ></component>
    <PreviewRecordMenu
      v-else
      :item="currentFieldObject.value"
      :typename="currentFieldObject.value.__typename"
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

  // options.fields: {fieldPath: string; component: any; }[]

  computed: {
    currentFieldObject() {
      if (!Array.isArray(this.options?.fields)) return null

      for (const fieldObject of this.options.fields) {
        const value = getNestedProperty(this.item, fieldObject.fieldPath)

        if (value)
          return {
            value,
            component: fieldObject.component,
          }
      }

      return null
    },
  },
}
</script>
