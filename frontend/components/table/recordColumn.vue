<template>
  <div>
    <PreviewRecordMenu
      v-if="currentValue"
      :item="currentValue"
      :typename="currentValue.__typename"
      :close-on-content-click="false"
      :min-width="300"
      :max-width="300"
      offset-y
      top
      open-mode="openInDialog"
    ></PreviewRecordMenu>
    <v-chip v-else small><i>None</i></v-chip>
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

  computed: {},
}
</script>
