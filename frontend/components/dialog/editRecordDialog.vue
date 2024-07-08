<template>
  <v-dialog
    scrollable
    max-width="800px"
    v-bind="$attrs"
    v-on="$listeners"
    :persistent="modeObject.persistent"
  >
    <component
      v-if="$attrs.value"
      :is="interfaceComponent"
      :selected-item="selectedItem"
      :record-info="recordInfo"
      :custom-fields="customFields"
      :mode="computedMode"
      dialog-mode
      :generation="generation"
      @handle-submit="handleSubmit"
      @close="close()"
      @item-updated="$emit('item-updated')"
      @reload-parent="$emit('reload-parent')"
    >
      <template v-slot:toolbar>
        <v-toolbar flat color="accent">
          <v-icon left v-if="!hideTitleMode">{{ icon }}</v-icon>
          <v-toolbar-title v-if="!hideTitleMode">
            <span class="headline">{{ title }}</span>
          </v-toolbar-title>
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
              computedMode !== 'add' &&
              computedMode !== 'import' &&
              !hideActionsMode
            "
            :record-info="recordInfo"
            :item="selectedItem"
            expand-mode="openInDialog"
            left
            offset-x
            @handle-action-click="openEditDialog"
            @handle-custom-action-click="handleCustomActionClick"
            @reload-parent="generation++"
            @close-parent="close()"
          ></RecordActionMenu>
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
            v-if="recordInfo.postOptions && selectedItem"
            class="mt-2 mx-auto elevation-6"
            style="max-width: 800px"
            :is="postInterface"
            :locked-filters="postLockedFilters"
            :hidden-fields="recordInfo.postOptions.hiddenFields"
            :record-info="recordInfo.postOptions.recordInfo"
            :page-options="initialPostPageOptions"
            :initial-sort-options="recordInfo.postOptions.initialSortOptions"
          ></component></div
      ></template>
    </component>
  </v-dialog>
</template>

<script>
import EditRecordInterface from '~/components/interface/crud/editRecordInterface.vue'
import ImportRecordInterface from '~/components/interface/crud/importRecordInterface.vue'
import DeleteRecordInterface from '~/components/interface/crud/deleteRecordInterface.vue'
import ShareRecordInterface from '~/components/interface/crud/shareRecordInterface.vue'
import ViewRecordInterface from '~/components/interface/crud/viewRecordInterface.vue'
import RecordActionMenu from '~/components/menu/recordActionMenu.vue'
import CrudPostInterface from '~/components/interface/crud/crudPostInterface.vue'

const modesMap = {
  add: {
    icon: 'mdi-plus',
    prefix: 'New',
    persistent: true,
    defaultInterface: EditRecordInterface,
  },
  import: {
    icon: 'mdi-upload',
    prefix: 'Import',
    persistent: true,
    defaultInterface: ImportRecordInterface,
  },
  copy: {
    icon: 'mdi-content-copy',
    prefix: 'Copy',
    persistent: true,
    defaultInterface: EditRecordInterface,
  },
  edit: {
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
  },

  props: {
    selectedItem: {
      type: Object,
    },

    recordInfo: {
      type: Object,
      required: true,
    },

    // custom fields that will override add/edit/view options on recordInfo
    customFields: {
      type: Array,
    },

    // this OR specialMode must be provided
    mode: {
      type: String,
      validator: (value) => {
        return [
          'add',
          'import',
          'edit',
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
      return !!this.recordInfo.dialogOptions?.hideActions
    },

    hideRefreshMode() {
      return !!this.recordInfo.dialogOptions?.hideRefresh
    },

    hideTitleMode() {
      return !!this.recordInfo.dialogOptions?.hideTitle
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
      return this.recordInfo[`${this.computedMode}Options`]
    },

    title() {
      return (
        this.options?.title ??
        `${this.modeObject.prefix} ${this.recordInfo.name}`
      )
    },
    icon() {
      return this.options?.icon ?? this.modeObject.icon
    },

    postLockedFilters() {
      return (
        this.recordInfo.postOptions?.getLockedFilters?.(
          this,
          this.selectedItem
        ) ??
        (this.selectedItem
          ? [
              {
                field: this.recordInfo.typename,
                operator: 'eq',
                value: this.selectedItem.id,
              },
            ]
          : null)
      )
    },

    postInterface() {
      return this.recordInfo.postOptions?.component ?? CrudPostInterface
    },

    initialPostPageOptions() {
      return this.recordInfo.postOptions?.initialSortOptions
        ? {
            sort: this.recordInfo.postOptions?.initialSortOptions,
          }
        : null
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
    openEditDialog(mode) {
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
