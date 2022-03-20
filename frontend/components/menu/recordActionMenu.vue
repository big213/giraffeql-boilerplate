<template>
  <v-menu v-bind="$attrs">
    <!-- pass through scoped slots -->
    <template v-slot:activator="slotData">
      <slot v-if="$scopedSlots.activator" name="activator" v-bind="slotData" />
      <v-icon v-else v-bind="slotData.attrs" v-on="slotData.on"
        >mdi-dots-vertical</v-icon
      >
    </template>

    <v-list dense>
      <v-list-item
        v-if="recordInfo.enterOptions && !hideEnter"
        key="enter"
        @click="goToRecordPage(true)"
      >
        <v-list-item-icon>
          <v-icon>mdi-newspaper-variant-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-title
          >Go To Page
          <v-icon small right>mdi-open-in-new</v-icon>
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="recordInfo.viewOptions && !hideView"
        key="view"
        @click="openEditDialog('view')"
      >
        <v-list-item-icon>
          <v-icon>mdi-eye</v-icon>
        </v-list-item-icon>
        <v-list-item-title>View</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="recordInfo.shareOptions"
        key="share"
        @click="openEditDialog('share')"
      >
        <v-list-item-icon>
          <v-icon>mdi-share-variant</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Share</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="recordInfo.editOptions"
        key="edit"
        @click="openEditDialog('edit')"
      >
        <v-list-item-icon>
          <v-icon>{{ recordInfo.editOptions.icon || 'mdi-pencil' }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{
          recordInfo.editOptions.text || 'Edit'
        }}</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="recordInfo.copyOptions"
        key="copy"
        @click="openEditDialog('copy')"
      >
        <v-list-item-icon>
          <v-icon>
            {{ recordInfo.copyOptions.icon || 'mdi-content-copy' }}</v-icon
          >
        </v-list-item-icon>
        <v-list-item-title>{{
          recordInfo.copyOptions.text || 'Duplicate'
        }}</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="recordInfo.deleteOptions"
        key="delete"
        @click="openEditDialog('delete')"
      >
        <v-list-item-icon>
          <v-icon>mdi-delete</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Delete</v-list-item-title>
      </v-list-item>
      <template v-if="customActions.length > 0">
        <v-divider></v-divider>
        <v-list-item
          v-for="(actionWrapper, i) in customActions"
          :key="'ca' + i"
          dense
          @click="handleCustomActionClick(actionWrapper)"
        >
          <v-list-item-icon>
            <v-progress-circular
              v-if="actionWrapper.isLoading"
              size="24"
              indeterminate
            ></v-progress-circular>
            <v-icon v-else>{{ actionWrapper.actionObject.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title
            >{{ actionWrapper.actionObject.text }}
          </v-list-item-title>
        </v-list-item>
      </template>

      <v-divider v-if="recordInfo.expandTypes.length > 0"></v-divider>
      <v-list-item
        v-for="(expandObject, i) in recordInfo.expandTypes"
        :key="i"
        dense
        @click="openExpandType(expandObject, i)"
      >
        <v-list-item-icon>
          <v-icon>{{
            expandObject.icon || expandObject.recordInfo.icon
          }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title
          >{{ expandObject.name || expandObject.recordInfo.name }}
          <v-icon v-if="expandMode === 'openInNew'" small right
            >mdi-open-in-new</v-icon
          >
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { enterRoute, generateViewRecordRoute } from '~/services/base'

export default {
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    recordInfo: {
      type: Object,
      required: true,
    },
    hideView: {
      type: Boolean,
    },
    hideEnter: {
      type: Boolean,
    },
    expandMode: {
      type: String,
      default: 'emit',
      validator: (value) => {
        return ['emit', 'openInNew', 'openInDialog'].includes(value)
      },
    },
  },

  data() {
    return {
      status: false,
      customActions: [],
    }
  },

  created() {
    this.customActions = this.recordInfo.customActions
      ? this.recordInfo.customActions
          .filter((customAction) =>
            customAction.showIf ? customAction.showIf(this, this.item) : true
          )
          .map((actionObject) => ({
            isLoading: false,
            actionObject,
          }))
      : []
  },

  methods: {
    openEditDialog(mode) {
      this.$emit('handle-action-click', mode, this.item)
    },

    openExpandType(expandTypeObject, index) {
      if (this.expandMode === 'emit')
        this.$emit('handle-expand-click', expandTypeObject, index)
      else if (this.expandMode === 'openInDialog')
        this.$root.$emit('openCrudRecordDialog', {
          recordInfo: expandTypeObject.recordInfo,
          lockedFilters: expandTypeObject.lockedFilters
            ? expandTypeObject.lockedFilters(this, this.item)
            : [],
          title: expandTypeObject.name,
          icon: expandTypeObject.icon,
          hiddenHeaders: expandTypeObject.excludeHeaders,
          excludeFilters: expandTypeObject.excludeFilters,
          pageOptions: {
            search: null,
            filters: expandTypeObject.initialFilters ?? [],
            sort: expandTypeObject.initialSortOptions ?? undefined,
          },
        })
      else {
        this.goToRecordPage(false, index)
      }
    },

    reloadParent() {
      this.$emit('reload-parent')
    },

    async handleCustomActionClick(actionWrapper) {
      // this.$emit('handle-custom-action-click', actionObject, this.item)

      // if the actionWrapper is already loading and it is asynchronous, prevent the action
      if (actionWrapper.actionObject.isAsync && actionWrapper.isLoading) {
        this.$notifier.showSnackbar({
          message: 'Action currently in progress',
          variant: 'warning',
        })
        return
      }

      if (actionWrapper.actionObject.isAsync) actionWrapper.isLoading = true

      await actionWrapper.actionObject.handleClick(this, this.item)

      actionWrapper.isLoading = false
    },

    goToRecordPage(openInNew, expandIndex) {
      enterRoute(
        this,
        generateViewRecordRoute(this, {
          typename: this.recordInfo.typename,
          routeType: this.recordInfo.enterOptions.routeType,
          id: this.item.id,
          expand: expandIndex,
        }),
        openInNew
      )
    },
  },
}
</script>
