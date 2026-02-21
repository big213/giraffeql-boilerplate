<template>
  <span>
    <v-icon
      v-if="renderObject.renderDefinition.editOptions?.mode === 'left'"
      small
      @click.stop="openEditItemDialog()"
      >mdi-pencil</v-icon
    >
    <component
      v-if="renderObject.renderDefinition.component"
      :is="renderObject.renderDefinition.component"
      :item="item"
      :render-field-definition="renderObject"
      :display-mode="displayMode"
      @open-edit-dialog="openEditItemDialog()"
    ></component>
    <span
      v-else
      :class="displayMode === 'view' ? 'break-space' : null"
      :title="tableRowData"
      >{{ tableRowData }}</span
    >
    <v-icon
      v-if="
        renderObject.renderDefinition.editOptions &&
        (!renderObject.renderDefinition.editOptions.mode ||
          renderObject.renderDefinition.editOptions.mode === 'right')
      "
      small
      right
      @click.stop="openEditItemDialog()"
      >mdi-pencil</v-icon
    >
  </span>
</template>

<script>
import { getNestedProperty } from '~/services/base'

export default {
  props: {
    // renderObject or viewObject
    renderObject: {
      type: Object,
      required: true,
    },
    item: {
      type: Object,
      required: true,
    },
    // where is this column displayed? null | 'crud' | 'view' | 'preview'
    displayMode: {
      type: String,
    },
  },

  computed: {
    tableRowData() {
      // use a defined pathPrefix, else use the fieldKey, else null
      const pathPrefix =
        this.renderObject.renderDefinition.pathPrefix === undefined
          ? this.renderObject.fieldKey
          : this.renderObject.renderDefinition.pathPrefix

      // need to go deeper if nested
      return pathPrefix ? getNestedProperty(this.item, pathPrefix) : this.item
    },
  },

  methods: {
    openEditItemDialog() {
      if (this.renderObject.renderDefinition.editOptions.action) {
        this.$root.$emit('openExecuteActionDialog', {
          action: this.renderObject.renderDefinition.editOptions.action,
          parentItem: this.item,
        })
      } else {
        this.$emit(
          'edit-item',
          this.item,
          this.renderObject.renderDefinition.editOptions.fieldKeys ?? [
            this.renderObject.fieldKey,
          ]
        )
      }
    },
  },
}
</script>
