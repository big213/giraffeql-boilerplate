<template>
  <div style="max-height: 100px">
    {{ currentValue }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],
}
</script>
