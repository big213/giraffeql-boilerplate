<template>
  <v-chip :color="color" v-bind="$attrs" v-on="$listeners">
    <span :class="textClass">{{ title }}</span>
    <slot name="right-icon"></slot>
  </v-chip>
</template>

<script>
export default {
  props: {
    value: {}, // can be the index OR name
    valuesMap: {}, // optional -- the map used to generate the text/color, etc.
  },
  data() {
    return {}
  },

  computed: {
    title() {
      return this.valuesMap?.[this.value]?.text ?? this.value
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
