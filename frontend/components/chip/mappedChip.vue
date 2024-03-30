<template>
  <v-chip :color="color" v-bind="$attrs" v-on="$listeners">
    <span :class="textClass">{{ title }}</span>
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
      return (this.valuesMap?.[this.value]?.textColor ?? 'white') + '--text'
    },
  },
}
</script>
