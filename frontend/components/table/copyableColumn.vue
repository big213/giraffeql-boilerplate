<template>
  <span v-if="currentValue" @click.stop="copyToClipboard(currentValue)">
    <v-chip small class="pointer-cursor"
      >{{ currentValue }}<v-icon small right>mdi-content-copy</v-icon></v-chip
    >
  </span>
</template>

<script>
import { copyToClipboard } from '~/services/base'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
