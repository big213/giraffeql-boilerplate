<template>
  <div style="white-space: initial">
    <span
      v-for="(record, index) in records"
      :class="records.length > 1 ? 'mr-2' : null"
      :key="index"
    >
      <PreviewRecordMenu
        v-if="record"
        :item="record"
        :typename="record.__typename"
        :close-on-content-click="false"
        :min-width="300"
        :max-width="300"
        offset-y
        top
        open-mode="openInDialog"
      ></PreviewRecordMenu>
      <v-chip v-else small><i>None</i></v-chip>
    </span>
    <i v-if="!records.length">None</i>
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

  computed: {
    records() {
      return Array.isArray(this.currentValue)
        ? this.currentValue
        : [this.currentValue]
    },
  },
}
</script>
