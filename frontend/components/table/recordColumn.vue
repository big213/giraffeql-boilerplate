<template>
  <span style="white-space: initial">
    <span
      v-for="(record, index) in records"
      :class="records.length > 1 ? 'mr-2' : null"
      :key="index"
    >
      <component
        v-if="component && record"
        :is="component"
        :value="record"
        small
      ></component>
      <PreviewRecordChip
        v-else-if="
          record &&
          renderFieldDefinition.renderDefinition.editOptions?.mode ===
            'component'
        "
        :value="record"
        small
        @click.stop="$emit('open-edit-dialog')"
      >
        <template
          v-slot:left-icon
          v-if="
            renderFieldDefinition.renderDefinition.editOptions?.mode ===
            'component'
          "
        >
          <v-icon small left class="pr-2">mdi-pencil</v-icon>
        </template>
      </PreviewRecordChip>
      <PreviewRecordChip v-else-if="record" :value="record" small>
      </PreviewRecordChip>
      <v-chip v-else-if="emptyText" small
        ><i>{{ emptyText }}</i></v-chip
      >
    </span>
    <i v-if="!records.length && emptyText">{{ emptyText }}</i>
  </span>
</template>

<script>
import columnMixin from '~/mixins/column'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'

export default {
  components: {
    PreviewRecordChip,
  },

  // this component implements editOptions?.mode === 'component' properly

  mixins: [columnMixin],

  computed: {
    records() {
      return Array.isArray(this.currentValue)
        ? this.currentValue
        : [this.currentValue]
    },

    emptyText() {
      return this.options?.emptyText
    },

    component() {
      return this.options?.component
    },
  },
}
</script>
