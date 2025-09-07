<template>
  <v-dialog
    scrollable
    :max-width="computedMaxWidth"
    v-bind="$attrs"
    v-on="$listeners"
    :persistent="modeObject.persistent"
  >
    <component
      v-if="$attrs.value"
      :is="interfaceComponent"
      :locked-fields="lockedFields"
      :parent-item="parentItem"
      :view-definition="viewDefinition"
      :custom-fields="customFields"
      :mode="computedMode"
      dialog-mode
      :generation="generation"
      @handle-submit="handleSubmit"
      @close="close()"
      @item-updated="$emit('item-updated')"
      @reload-parent="$emit('reload-parent')"
      @reload-parent-item="$emit('reload-parent-item')"
    >
      <template v-slot:toolbar>
        <v-toolbar flat color="accent">
          <v-icon left v-if="!hideTitleMode">{{ icon }}</v-icon>
          <v-toolbar-title v-if="!hideTitleMode">
            <span class="headline">{{ title }}</span>
          </v-toolbar-title>
          <v-divider v-if="parentItem" class="mx-4" inset vertical></v-divider>
          <PreviewRecordChip
            v-if="parentItem"
            :value="parentItem"
            class="pointer-cursor"
          >
          </PreviewRecordChip>
          <v-spacer></v-spacer>
          <v-btn
            v-if="computedMode === 'view' && !hideRefreshMode"
            icon
            @click="reset()"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <RecordActionMenu
            v-if="
              computedMode !== 'create' &&
              computedMode !== 'import' &&
              !hideActionsMode
            "
            :view-definition="viewDefinition"
            :item="parentItem"
            expand-mode="openInDialog"
            left
            offset-x
            :btn-attrs="{ icon: true }"
            @handle-action-click="openEditDialog"
            @handle-custom-action-click="handleCustomActionClick"
            @reload-parent="generation++"
            @close-parent="close()"
          >
            <template v-slot:btn-content>
              <v-icon>mdi-dots-vertical</v-icon>
            </template>
          </RecordActionMenu>
          <v-btn icon @click="close()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:footer-action>
        <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
      </template>
      <template v-slot:posts>
        <v-divider class="mx-3"></v-divider>
        <div class="mx-2">
          <component
            v-if="viewDefinition.postOptions && postLockedFilters"
            class="mt-2 mx-auto elevation-6"
            style="max-width: 800px"
            :is="postInterface"
            :locked-filters="postLockedFilters"
            :hidden-fields="viewDefinition.postOptions.hiddenFields"
            :view-definition="viewDefinition.postOptions.viewDefinition"
            :page-options="initialPostPageOptions"
            :readonly="viewDefinition.postOptions.readonly"
          ></component></div
      ></template>
    </component>
  </v-dialog>
</template>

<script>
import EditRecordInterface from '~/components/interface/crud/editRecordInterface.vue'
import ImportRecordInterface from '~/components/interface/crud/importRecordInterface.vue'
import BatchUpdateRecordInterface from '~/components/interface/crud/batchUpdateRecordInterface.vue'
import DeleteRecordInterface from '~/components/interface/crud/deleteRecordInterface.vue'
import ShareRecordInterface from '~/components/interface/crud/shareRecordInterface.vue'
import ViewRecordInterface from '~/components/interface/crud/viewRecordInterface.vue'
import RecordActionMenu from '~/components/menu/recordActionMenu.vue'
import CrudPostInterface from '~/components/interface/crud/crudPostInterface.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'

const modesMap = {
  create: {
    icon: 'mdi-plus',
    prefix: 'Create',
    persistent: true,
    defaultInterface: EditRecordInterface,
  },
  import: {
    icon: 'mdi-upload',
    prefix: 'Import',
    persistent: true,
    defaultInterface: ImportRecordInterface,
  },
  batchUpdate: {
    icon: 'mdi-table-arrow-up',
    prefix: 'Batch Update',
    persistent: true,
    defaultInterface: BatchUpdateRecordInterface,
  },
  copy: {
    icon: 'mdi-content-copy',
    prefix: 'Copy',
    persistent: true,
    defaultInterface: EditRecordInterface,
  },
  update: {
    icon: 'mdi-pencil',
    prefix: 'Edit',
    persistent: true,
    defaultInterface: EditRecordInterface,
  },
  view: {
    icon: 'mdi-eye',
    prefix: 'View',
    persistent: false,
    defaultInterface: ViewRecordInterface,
  },
  delete: {
    icon: 'mdi-delete',
    prefix: 'Delete',
    persistent: false,
    defaultInterface: DeleteRecordInterface,
  },
  share: {
    icon: 'mdi-share-variant',
    prefix: 'Share',
    persistent: false,
    defaultInterface: ShareRecordInterface,
  },
}

export default {
  components: {
    RecordActionMenu,
    PreviewRecordChip,
  },

  props: {
    lockedFields: {},

    viewDefinition: {
      type: Object,
      required: true,
    },

    // custom fields that will override add/edit/view options on viewDefinition
    customFields: {
      type: Array,
    },

    // this OR specialMode must be provided
    mode: {
      type: String,
      validator: (value) => {
        return [
          'create',
          'import',
          'batchUpdate',
          'update',
          'view',
          'delete',
          'copy',
          'share',
        ].includes(value)
      },
    },

    specialMode: {
      type: Object,
    },

    parentItem: {},

    maxWidth: {},
  },
  data() {
    return {
      overrideMode: null,
      generation: 0,
    }
  },

  computed: {
    computedMode() {
      return this.overrideMode ?? this.mode
    },

    hideActionsMode() {
      return !!this.viewDefinition.dialogOptions?.hideActions
    },

    hideRefreshMode() {
      return !!this.viewDefinition.dialogOptions?.hideRefresh
    },

    hideTitleMode() {
      return !!this.viewDefinition.dialogOptions?.hideTitle
    },

    modeObject() {
      return this.specialMode ?? modesMap[this.computedMode]
    },

    interfaceComponent() {
      return this.specialMode
        ? this.modeObject.defaultInterface
        : this.options?.component ?? this.modeObject.defaultInterface
    },

    options() {
      return this.computedMode === 'import' ||
        this.computedMode === 'batchUpdate'
        ? this.viewDefinition.paginationOptions[`${this.computedMode}Options`]
        : this.viewDefinition[`${this.computedMode}Options`]
    },

    title() {
      return (
        this.options?.title ??
        `${this.modeObject.prefix} ${this.viewDefinition.entity.name}`
      )
    },
    icon() {
      return this.options?.icon ?? this.modeObject.icon
    },

    postLockedFilters() {
      return (
        this.viewDefinition.postOptions?.getLockedFilters?.(
          this,
          this.parentItem
        ) ??
        (this.parentItem
          ? [
              {
                field: `${this.viewDefinition.entity.typename}.id`,
                operator: 'eq',
                value: this.parentItem.id,
              },
            ]
          : null)
      )
    },

    postInterface() {
      return this.viewDefinition.postOptions?.component ?? CrudPostInterface
    },

    initialPostPageOptions() {
      return this.viewDefinition.postOptions?.initialSortKey
        ? {
            sort: this.viewDefinition.postOptions.initialSortKey,
          }
        : null
    },

    computedMaxWidth() {
      return this.maxWidth ?? '800px'
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

    // toggle the dialog to another mode
    openEditDialog({ mode }) {
      this.overrideMode = mode
    },

    handleCustomActionClick(actionObject, item) {
      actionObject.handleClick(this, item)
    },

    handleSubmit(data) {
      this.$emit('handle-submit', data)
    },

    reset() {
      this.overrideMode = null
      this.generation++
    },
  },
}
</script>
