<template>
  <span>
    <v-icon
      v-if="renderObject.renderDefinition.editOptions?.mode === 'left'"
      small
      right
      @click.stop="openEditItemDialog()"
      >mdi-pencil</v-icon
    >
    <component
      v-if="renderObject.renderDefinition.component"
      :is="renderObject.renderDefinition.component"
      :item="item"
      :render-field-definition="renderObject"
      :display-mode="displayMode"
    ></component>
    <span v-else :class="displayMode === 'view' ? 'break-space' : null">{{
      getTableRowData()
    }}</span>
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

  methods: {
    openEditItemDialog() {
      this.$emit(
        'edit-item',
        this.item,
        this.renderObject.renderDefinition.editOptions.fieldKeys ?? [
          this.renderObject.fieldKey,
        ]
      )
    },

    getTableRowData() {
      // need to go deeper if nested
      return getNestedProperty(this.item, this.renderObject.fieldKey)
    },
  },
}
</script>
