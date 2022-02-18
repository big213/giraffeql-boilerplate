<template>
  <div :title="generateDateLocaleString(currentValue) || 'None'">
    {{ generateTimeAgoString(currentValue) || 'None' }}
  </div>
</template>

<script>
import {
  generateTimeAgoString,
  generateDateLocaleString,
} from '~/services/base'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  methods: {
    generateTimeAgoString,
    generateDateLocaleString,
  },
}
</script>
