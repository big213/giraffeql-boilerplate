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
      <v-chip v-else-if="emptyText" small
        ><i>{{ emptyText }}</i></v-chip
      >
    </span>
    <i v-if="!records.length && emptyText">{{ emptyText }}</i>
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

  // options.fields should be a list of the possible values

  computed: {
    records() {
      if (!Array.isArray(this.options.fields)) return []

      return this.options.fields.reduce((total, fieldPath) => {
        const value = getNestedProperty(this.currentValue, fieldPath)

        if (value) total.push(value)
        return total
      }, [])
    },

    emptyText() {
      return this.options?.emptyText
    },
  },
}
</script>
