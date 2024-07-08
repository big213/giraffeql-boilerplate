<template>
  <div
    :style="style"
    :class="isBreakSpace ? 'break-space' : null"
    v-text="currentValue"
  ></div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  // options.breakSpace -- boolean. Should the element show empty spaces?
  // options.style -- string. the style attribute, if customized

  computed: {
    isBreakSpace() {
      return !!this.options?.breakSpace
    },

    style() {
      return this.options?.style ?? 'max-height: 100px'
    },
  },
}
</script>
