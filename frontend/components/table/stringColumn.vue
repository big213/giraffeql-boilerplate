<template>
  <span :title="titleStr">
    <v-icon
      v-if="options?.copyable"
      small
      @click.stop="copyToClipboard(displayStr)"
      >mdi-content-copy</v-icon
    >
    <span v-for="(part, i) in displayStrParts" :key="i">
      {{ part }}
      <br v-if="i !== displayStrParts.length - 1" />
    </span>
  </span>
</template>

<script>
import columnMixin from '~/mixins/column'
import { copyToClipboard } from '~/services/base'

export default {
  mixins: [columnMixin],
  computed: {
    displayStr() {
      return this.options?.getDisplayStr
        ? this.options.getDisplayStr(this.currentValue, this.item)
        : this.currentValue
    },

    displayStrParts() {
      return this.displayStr?.split('\n') ?? []
    },

    titleStr() {
      return this.options?.showTitle
        ? this.displayStr
        : this.options?.getTitleStr
        ? this.options.getTitleStr(
            this.currentValue,
            this.item,
            this.displayStr
          )
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
