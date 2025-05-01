<template>
  <span :title="titleStr">
    {{ displayStr }}
  </span>
</template>

<script>
import columnMixin from '~/mixins/column'
export default {
  mixins: [columnMixin],
  computed: {
    displayStr() {
      return this.options?.getDisplayStr
        ? this.options.getDisplayStr(this.currentValue, this.item)
        : this.currentValue
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
}
</script>
