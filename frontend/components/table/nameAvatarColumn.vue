<template>
  <div v-if="currentValue" :title="currentValue.name">
    <v-avatar size="24">
      <v-img v-if="currentValue.avatar" :src="currentValue.avatar"></v-img>
      <v-icon v-else>{{ fallbackIcon }}</v-icon>
    </v-avatar>
    {{ currentValue.name }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { getIcon } from '~/services/base'

export default {
  mixins: [columnMixin],

  computed: {
    fallbackIcon() {
      return getIcon(this.currentValue.__typename)
    },
  },
}
</script>
