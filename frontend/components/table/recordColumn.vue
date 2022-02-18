<template>
  <div v-if="currentValue">
    <PreviewRecordMenu
      :item="currentValue"
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

export default {
  components: {
    PreviewRecordMenu,
  },

  mixins: [columnMixin],
}
</script>
