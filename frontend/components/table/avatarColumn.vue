<template>
  <v-avatar size="64">
    <v-img v-if="currentValue" :src="currentValue"></v-img>
    <v-icon v-else>{{ fallbackIcon }}</v-icon>
  </v-avatar>
</template>

<script>
import columnMixin from '~/mixins/column'
import { getIcon } from '~/services/base'

export default {
  mixins: [columnMixin],

  computed: {
    fallbackIcon() {
      return getIcon(this.item.__typename)
    },
  },
}
</script>
