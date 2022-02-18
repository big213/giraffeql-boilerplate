<template>
  <div :title="displayString">
    {{ displayString }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  computed: {
    displayString() {
      return this.currentValue ?? 'None'
    },
  },
}
</script>
