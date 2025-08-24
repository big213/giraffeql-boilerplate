<template>
  <pre>{{ displayStr }}</pre>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  computed: {
    displayStr() {
      return typeof this.currentValue === 'string'
        ? JSON.parse(this.currentValue)
        : this.currentValue
    },
  },
}
</script>
<style scoped>
pre {
  white-space: pre-wrap;
}
</style>
