<template>
  <v-dialog v-model="status" max-width="500px" persistent>
    <v-card flat>
      <slot name="toolbar"></slot>
      <v-card-text class="pt-3">
        <v-autocomplete
          v-bind="$attrs"
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
            <PreviewRecordChip :item="data.item"></PreviewRecordChip>
          </template>

          <template v-slot:item="data">
            <PreviewRecordChip :item="data.item"></PreviewRecordChip>
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
import CircularLoader from '~/components/common/circularLoader.vue'
import GenericInput from '~/components/input/genericInput.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import { getIcon } from '~/services/base'

export default {
  components: {
    CircularLoader,
    GenericInput,
    PreviewRecordChip,
  },

  props: {
    status: {
      type: Boolean,
      default: true,
    },
    options: {
      type: Array,
      required: true,
    },
  },

  watch: {
    status(val) {
      if (val) {
        this.reset()
      }
    },
  },
  methods: {
    getIcon,
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
