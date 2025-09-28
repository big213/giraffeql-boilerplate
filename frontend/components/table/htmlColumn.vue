<template>
  <div
    v-if="currentValue"
    class="editr--content"
    v-html="currentValue"
    style="background-color: white; color: black"
  ></div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],
}
</script>
