<template>
  <div v-if="currentValue" :title="name">
    <v-avatar size="24">
      <v-img v-if="avatarUrl" :src="avatarUrl"></v-img>
      <v-icon v-else>{{ fallbackIcon }}</v-icon>
    </v-avatar>
    <span v-if="name">
      <v-icon v-if="options?.copyable" small @click.stop="copyToClipboard(name)"
        >mdi-content-copy</v-icon
      >
      {{ name }}
    </span>
    <i v-else>(Untitled)</i>
    <slot name="components"></slot>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { getIcon } from '~/services/entity'
import { copyToClipboard } from '~/services/base'

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

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
