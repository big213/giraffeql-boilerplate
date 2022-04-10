<template>
  <div v-if="currentValueComputed">
    <div v-for="(url, index) in currentValueComputed" :key="index">
      <a :title="url" @click.stop="openLink(url)">
        <v-icon small>mdi-open-in-new</v-icon>
        {{ url }}</a
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
  computed: {
    currentValueComputed() {
      if (!this.currentValue) return null

      return Array.isArray(this.currentValue)
        ? this.currentValue.map((ele) => ele.main) // it was serialized
        : [this.currentValue]
    },
  },
}
</script>
