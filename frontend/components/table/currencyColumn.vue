<template>
  <div>
    {{ displayStr }}
  </div>
</template>

<script>
import { formatAsCurrency } from '~/services/base'
import columnMixin from '~/mixins/column'
export default {
  mixins: [columnMixin],
  computed: {
    displayStr() {
      return this.currentValue !== null
        ? formatAsCurrency(this.currentValue)
        : this.options?.emptyText ?? 'N/A'
    },
  },
}
</script>
