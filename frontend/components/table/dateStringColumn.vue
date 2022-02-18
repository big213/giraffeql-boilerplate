<template>
  <div :title="timeString">
    {{ dateString }}
  </div>
</template>

<script>
import { generateDateLocaleString } from '~/services/base'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  computed: {
    timeString() {
      return generateDateLocaleString(this.currentValue) ?? 'None'
    },
    dateString() {
      return this.timeString.split(' ')[0]
    },
  },
}
</script>
