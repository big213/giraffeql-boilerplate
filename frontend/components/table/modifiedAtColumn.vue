<template>
  <div
    :title="
      generateDateLocaleString(currentValue.updatedAt || currentValue.createdAt)
    "
  >
    {{
      generateTimeAgoString(currentValue.updatedAt || currentValue.createdAt)
    }}
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
