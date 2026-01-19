<template>
  <span style="white-space: initial">
    <span
      v-for="(element, index) in elements"
      :class="elements.length > 1 ? 'mr-2' : null"
      :key="index"
      :title="element"
    >
      <MappedChip
        v-if="
          renderFieldDefinition.renderDefinition.editOptions?.mode ===
          'component'
        "
        small
        :value="element"
        :values-map="options?.valuesMap"
        :title-case="options?.titleCase"
        :empty-text="emptyText"
        @click.stop="$emit('open-edit-dialog')"
      >
        <template
          v-slot:left-icon
          v-if="
            renderFieldDefinition.renderDefinition.editOptions?.mode ===
            'component'
          "
        >
          <v-icon small left>mdi-pencil</v-icon>
        </template>
      </MappedChip>
      <MappedChip
        v-else
        small
        :value="element"
        :values-map="options?.valuesMap"
        :title-case="options?.titleCase"
        :empty-text="emptyText"
      >
      </MappedChip>
    </span>
    <i v-if="!elements.length && emptyText">{{ emptyText }}</i>
  </span>
</template>

<script>
import columnMixin from '~/mixins/column'
import MappedChip from '~/components/chip/mappedChip.vue'

export default {
  components: {
    MappedChip,
  },

  /* expected options:

  emptyText?: string;

  valuesMap?: {
    [x: string]: {
      text: string
      color?: string
      textColor?: string // defaults to black
    }
  }

  // should the values be converted to title case?
  titleCase?: boolean;
  
  // this component implements editOptions?.mode === 'component' properly
  */

  mixins: [columnMixin],

  computed: {
    elements() {
      return Array.isArray(this.currentValue)
        ? this.currentValue
        : [this.currentValue]
    },

    emptyText() {
      return this.options?.emptyText
    },
  },
}
</script>
