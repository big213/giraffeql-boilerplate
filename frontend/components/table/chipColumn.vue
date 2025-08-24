<template>
  <span style="white-space: initial">
    <span
      v-for="(element, index) in elements"
      :class="elements.length > 1 ? 'mr-2' : null"
      :key="index"
    >
      <MappedChip
        v-if="element"
        :small="options?.smallMode"
        :value="element"
        :values-map="options?.valuesMap"
      >
      </MappedChip>
      <v-chip v-else-if="emptyText" small
        ><i>{{ emptyText }}</i></v-chip
      >
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
  smallMode?: boolean
  emptyText?: string;
  valuesMap?: {
    [x: string]: {
      text: string
      color?: string
      textColor?: string // defaults to black
    }
  }
  editable?: boolean;
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
