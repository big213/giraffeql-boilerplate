<template>
  <v-dialog
    scrollable
    max-width="800px"
    v-bind="$attrs"
    v-on="$listeners"
    persistent
  >
    <component
      :is="interfaceComponent"
      :action-options="actionOptions"
      :item="item"
      :selected-item="selectedItem"
      dialog-mode
      :generation="generation"
      @handle-submit="handleSubmit"
      @close="close()"
    >
      <template v-slot:toolbar>
        <v-toolbar flat color="accent">
          <PreviewRecordChip v-if="item" :value="item" class="pointer-cursor">
          </PreviewRecordChip>
          <v-divider v-if="item" class="mx-4" inset vertical></v-divider>
          <v-icon left>{{ actionOptions.icon }}</v-icon>
          <v-toolbar-title>
            <span class="headline">{{ actionOptions.title }}</span>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="close()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:footer-action>
        <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
      </template>
    </component>
  </v-dialog>
</template>

<script>
import ExecuteActionInterface from '~/components/interface/action/executeActionInterface.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'

export default {
  components: {
    PreviewRecordChip,
  },

  props: {
    item: {
      type: Object,
    },

    selectedItem: {
      type: Object,
    },

    actionOptions: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      generation: 0,
    }
  },

  computed: {
    interfaceComponent() {
      return this.actionOptions.component ?? ExecuteActionInterface
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

    handleSubmit(data) {
      this.$emit('handle-submit', data)
    },

    reset() {
      this.generation++
    },
  },
}
</script>
