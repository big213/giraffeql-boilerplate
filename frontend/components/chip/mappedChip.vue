<template>
  <v-chip :color="color" v-bind="$attrs" v-on="$listeners">
    <slot name="left-icon"></slot>
    <span v-if="value" :class="textClass">{{ title }}</span>
    <i v-else>{{ emptyText ?? 'None' }}</i>
    <slot name="right-icon"></slot>
  </v-chip>
</template>

<script>
import { snakeCaseToTitleCase } from '~/services/base'

export default {
  props: {
    value: {}, // can be the index OR name
    valuesMap: {}, // optional -- the map used to generate the text/color, etc.
    titleCase: { type: Boolean }, // optional -- quick way of converting from snake_case to title case
    emptyText: {}, // optional override emptyText
  },
  data() {
    return {}
  },

  computed: {
    title() {
      return this.titleCase
        ? snakeCaseToTitleCase(this.value)
        : this.valuesMap?.[this.value]?.text ?? this.value
    },
    color() {
      return this.valuesMap?.[this.value]?.color ?? null
    },
    textClass() {
      const textColor = this.valuesMap?.[this.value]?.textColor

      return textColor
        ? `${this.valuesMap?.[this.value]?.textColor}--text`
        : null
    },
  },
}
</script>
