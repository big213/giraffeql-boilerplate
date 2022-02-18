<template>
  <div :title="currentValue">{{ currentValue }}</div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],
}
</script>
