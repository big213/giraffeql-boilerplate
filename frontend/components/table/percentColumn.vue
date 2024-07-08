<template>
  <div>
    {{ displayStr }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
export default {
  mixins: [columnMixin],
  computed: {
    displayStr() {
      return this.currentValue !== null
        ? `${this.currentValue * 100}%`
        : this.options?.emptyText ?? 'N/A'
    },
  },
}
</script>
