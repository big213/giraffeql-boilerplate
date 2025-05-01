<template>
  <v-snackbar
    v-bind="$attrs"
    v-on="$listeners"
    :color="params.color"
    :timeout="params.timeout || 4000"
  >
    <span :class="textClass">{{ params.message }}</span>
    <template v-slot:action="{ attrs }">
      <v-btn
        v-if="params.copyableText"
        text
        :class="textClass"
        v-bind="attrs"
        @click="copyToClipboard(params.copyableText)"
      >
        <v-icon left>mdi-content-copy</v-icon>
        Copy Data
      </v-btn>
      <v-btn :class="textClass" text v-bind="attrs" @click="$emit('close')">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { copyToClipboard } from '~/services/base'

const colorToTextColorMap = {
  success: 'black',
  error: 'white',
  warning: 'black',
  info: 'white',
}

export default {
  props: {
    // expecting obj with: message, color?, textColor?, copyableText?, timeout?
    params: {
      required: true,
    },
  },
  computed: {
    textClass() {
      return `${colorToTextColorMap[this.params.color] ?? 'black'}--text`
    },
  },
  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
