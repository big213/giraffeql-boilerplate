<template>
  <div style="white-space: initial">
    <span
      v-for="(element, index) in elements"
      :class="elements.length > 1 ? 'mr-2' : null"
      :key="index"
    >
      <v-chip
        v-if="element"
        :small="smallMode"
        :color="valuesMap ? valuesMap[element].color : null"
        >{{ valuesMap ? valuesMap[element].text : element }}
      </v-chip>
      <v-chip v-else-if="emptyText" small
        ><i>{{ emptyText }}</i></v-chip
      >
    </span>
    <i v-if="!elements.length && emptyText">{{ emptyText }}</i>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'

export default {
  components: {
    PreviewRecordMenu,
  },

  /* expected options:
  smallMode?: boolean
  emptyText?: string;
  valuesMap?: {
    [x: string]: {
      text: string
      color?: string
    }
  }
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

    smallMode() {
      return this.options?.smallMode
    },

    valuesMap() {
      return this.options?.valuesMap
    },
  },
}
</script>
