<template>
  <v-dialog width="500" v-bind="$attrs" v-on="$listeners">
    <v-card>
      <v-card-text class="pb-0 pt-5">
        <v-text-field
          ref="search"
          v-model="inputValue"
          prepend-icon="mdi-magnify"
          outlined
          label="Search query (Enter to submit)"
          clearable
          @keyup.enter="submit()"
        ></v-text-field>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    input: {
      type: String,
    },
  },

  data() {
    return {
      inputValue: null,
    }
  },

  watch: {
    '$attrs.value'(val) {
      if (!val) return

      // on open, sync the value with the input
      if (val) {
        this.inputValue = this.input
      }

      setTimeout(() => {
        this.$refs.search.focus()
      }, 0)
    },
  },

  methods: {
    submit() {
      this.$emit('handle-submit', this.inputValue)
      this.$emit('close')
    },
  },
}
</script>
