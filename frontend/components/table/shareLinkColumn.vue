<template>
  <div>
    {{ shareUrl }}
    <v-icon small @click.stop="copyToClipboard(shareUrl)"
      >mdi-content-copy</v-icon
    >
  </div>
</template>

<script>
import { copyToClipboard, generateShareUrl } from '~/services/base'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  computed: {
    shareUrl() {
      return generateShareUrl(this, {
        routeKey: this.item.__typename,
        id: this.item.id,
        showComments: true,
      })
    },
  },

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
