<template>
  <div>
    {{ formatBytes(currentValue) }}
  </div>
</template>

<script>
import { formatBytes } from '~/services/file'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  methods: {
    formatBytes,
  },
}
</script>
