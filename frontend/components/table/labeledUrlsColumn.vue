<template>
  <div v-if="currentValue">
    <div v-for="(labeledUrl, index) in currentValue" :key="index">
      {{ labeledUrl.title ? `${labeledUrl.title}: ` : '' }}
      <a :title="labeledUrl.url" @click.stop="openLink(labeledUrl.url)">
        <v-icon small>mdi-open-in-new</v-icon>
        {{ labeledUrl.url }}</a
      >
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { openLink } from '~/services/base'

export default {
  mixins: [columnMixin],

  methods: {
    openLink,
  },
}
</script>
