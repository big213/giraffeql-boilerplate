<template>
  <v-dialog max-width="500px" v-bind="$attrs" v-on="$listeners">
    <v-card flat>
      <slot name="toolbar"></slot>
      <v-card-text class="pt-3">
        <v-autocomplete
          :value="initialValue"
          :otpions="options"
          :items="options"
          item-text="name"
          item-value="id"
          label="Select"
          clearable
          filled
          return-object
          class="py-0"
          @change="handleChange"
        >
          <template v-slot:selection="data">
            <PreviewRecordChip :value="data.item"></PreviewRecordChip>
          </template>

          <template v-slot:item="data">
            <PreviewRecordChip :value="data.item"></PreviewRecordChip>
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'

export default {
  components: {
    PreviewRecordChip,
  },

  props: {
    initialValue: {},
    options: {
      type: Array,
      required: true,
    },
  },

  watch: {
    '$attrs.value'(val) {
      if (val) {
        this.reset()
      }
    },
  },
  methods: {
    close() {
      this.$emit('close')
    },

    handleChange(item) {
      this.$emit('handle-select', item)
      this.close()
    },

    reset() {},
  },
}
</script>
