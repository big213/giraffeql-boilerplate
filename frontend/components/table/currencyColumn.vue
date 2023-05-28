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
      return this.currentValue ? formatAsCurrency(this.currentValue) : 'N/A'
    },
  },
}
</script>
