<template>
  <v-avatar size="64" class="my-2">
    <v-img
      v-if="currentValue"
      :src="currentValue"
      class="pointer-cursor"
      @click.stop="openLink(currentValue)"
    ></v-img>
    <v-icon v-else>{{ fallbackIcon }}</v-icon>
  </v-avatar>
</template>

<script>
import columnMixin from '~/mixins/column'
import { openLink } from '~/services/base'
import { getIcon } from '~/services/entity'

export default {
  mixins: [columnMixin],

  methods: {
    openLink,
  },

  computed: {
    fallbackIcon() {
      return getIcon(this.item.__typename)
    },
  },
}
</script>
