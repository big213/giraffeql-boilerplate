<template>
  <div v-if="currentValue" :title="currentValue.name">
    <v-avatar size="24">
      <v-img
        v-if="currentValue.avatarUrl"
        :src="currentValue.avatarUrl"
      ></v-img>
      <v-icon v-else>{{ fallbackIcon }}</v-icon>
    </v-avatar>
    <span v-if="currentValue.name">{{ currentValue.name }}</span>
    <i v-else>(Untitled)</i>
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
