<template>
  <div v-if="currentValue" :title="name">
    <v-avatar size="24">
      <v-img v-if="avatarUrl" :src="avatarUrl"></v-img>
      <v-icon v-else>{{ fallbackIcon }}</v-icon>
    </v-avatar>
    <span v-if="name">{{ name }}</span>
    <i v-else>(Untitled)</i>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { getIcon } from '~/services/base'

export default {
  mixins: [columnMixin],

  /* expected options:
  nameField?: string // defaults to name
  avatarUrlField?: string; // defaults to avatarUrl
  */

  computed: {
    fallbackIcon() {
      return getIcon(this.currentValue.__typename)
    },

    name() {
      return this.currentValue[this.options?.nameField ?? 'name']
    },

    avatarUrl() {
      return this.currentValue[this.options?.avatarUrlField ?? 'avatarUrl']
    },
  },
}
</script>
