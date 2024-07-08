<template>
  <div
    :style="style"
    :class="isBreakSpace ? 'break-space' : null"
    v-text="currentValue"
    class="truncate-max-lines"
  ></div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  // options.breakSpace -- boolean. Should the element show empty spaces?
  // options.maxLines -- number. the number of lines after which to truncate, defaults to 3
  // options.height -- string (px). the height of the component, if fixed

  computed: {
    isBreakSpace() {
      return !!this.options?.breakSpace
    },

    style() {
      return {
        '-webkit-line-clamp': this.options?.maxLines ?? 3,
        height: this.options?.height,
      }
    },
  },
}
</script>
