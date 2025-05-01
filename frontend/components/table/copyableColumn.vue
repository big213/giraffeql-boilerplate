<template>
  <span>
    <v-chip
      v-if="currentValue"
      small
      class="pointer-cursor"
      :title="currentValue"
      :style="computedStyle"
      @click.stop="copyToClipboard(currentValue)"
    >
      <v-icon small left>mdi-content-copy</v-icon>
      <span>{{ currentValue }}</span></v-chip
    >
  </span>
</template>

<script>
import { copyToClipboard } from '~/services/base'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  computed: {
    computedStyle() {
      return this.options?.maxWidth
        ? `max-width: ${this.options.maxWidth}`
        : null
    },
  },

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
