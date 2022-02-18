<template>
  <div v-if="currentValue">
    <FileChip
      :file="currentValue"
      downloadable
      small
      label
      :close="false"
      class="mr-2"
    ></FileChip>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import FileChip from '~/components/chip/fileChip.vue'

export default {
  components: {
    FileChip,
  },

  mixins: [columnMixin],
}
</script>
