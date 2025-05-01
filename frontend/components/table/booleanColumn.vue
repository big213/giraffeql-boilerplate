<template>
  <span>
    <span v-if="currentValue === null">N/A</span>
    <v-chip
      v-else
      small
      :color="currentValue ? 'green' : 'red'"
      text-color="white"
    >
      {{ currentValue ? 'Yes' : 'No' }}
    </v-chip>
  </span>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],
}
</script>
