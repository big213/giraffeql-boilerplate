<template>
  <v-menu v-bind="$attrs">
    <!-- pass through scoped slots -->
    <template v-slot:activator="{ attrs, on }">
      <!--
      <slot v-if="$scopedSlots.activator" name="activator" v-bind="slotData" />
      <v-icon v-else v-bind="slotData.attrs" v-on="slotData.on"
        >mdi-dots-vertical</v-icon
      >
      -->
      <v-btn v-bind="{ ...attrs, ...btnAttrs }" v-on="on">
        <v-progress-circular
          v-if="isActionLoading"
          indeterminate
          size="23"
        ></v-progress-circular>
        <slot v-else name="btn-content"></slot>
      </v-btn>
    </template>

    <v-list dense>
      <v-list-item
        v-if="viewDefinition.viewOptions && !hideView"
        key="view"
        @click="openEditDialog('view')"
      >
        <v-list-item-icon>
          <v-icon>mdi-eye</v-icon>
        </v-list-item-icon>
        <v-list-item-title>View</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="viewDefinition.enterOptions && !hideEnter"
        key="enter"
        @click="goToRecordPage()"
        @click.middle="goToRecordPage(true)"
      >
        <v-list-item-icon>
          <v-icon>mdi-newspaper-variant-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-title
          >Go To Page
          <v-icon small right @click.stop="goToRecordPage(true)"
            >mdi-open-in-new</v-icon
          >
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="viewDefinition.shareOptions"
        key="share"
        @click="openEditDialog('share')"
      >
        <v-list-item-icon>
          <v-icon>mdi-share-variant</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Share</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="
          viewDefinition.updateOptions &&
          !isComponentHidden(viewDefinition.updateOptions)
        "
        key="update"
        @click="openEditDialog('update')"
      >
        <v-list-item-icon>
          <v-icon>{{
            viewDefinition.updateOptions.icon || 'mdi-pencil'
          }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{
          viewDefinition.updateOptions.text || 'Update'
        }}</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="viewDefinition.copyOptions && viewDefinition.createOptions"
        key="copy"
        @click="openEditDialog('copy')"
      >
        <v-list-item-icon>
          <v-icon>
            {{ viewDefinition.copyOptions.icon || 'mdi-content-copy' }}</v-icon
          >
        </v-list-item-icon>
        <v-list-item-title>{{
          viewDefinition.copyOptions.text || 'Duplicate'
        }}</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="
          viewDefinition.deleteOptions &&
          !isComponentHidden(viewDefinition.deleteOptions)
        "
        key="delete"
        @click="openEditDialog('delete')"
      >
        <v-list-item-icon>
          <v-icon>mdi-delete</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Delete</v-list-item-title>
      </v-list-item>
      <template v-if="visibleCustomActions.length > 0">
        <v-divider></v-divider>
        <v-list-item
          v-for="(actionWrapper, i) in visibleCustomActions"
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

      <v-divider v-if="viewDefinition.childTypes.length > 0"></v-divider>
      <v-list-item
        v-for="(expandObject, i) in viewDefinition.childTypes"
        :key="i"
        dense
        @click="openExpandType(expandObject)"
        @click.middle="openExpandType(expandObject, true)"
      >
        <v-list-item-icon>
          <v-icon>{{
            expandObject.icon || expandObject.viewDefinition.entity.icon
          }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title
          >{{ expandObject.name || expandObject.viewDefinition.entity.name }}
          <v-icon
            v-if="expandMode === 'openInNew'"
            small
            right
            @click.stop="openExpandType(expandObject, true)"
            >mdi-open-in-new</v-icon
          >
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import {
  enterRoute,
  generateViewRecordRoute,
  handleError,
} from '~/services/base'

export default {
  props: {
    item: {
      type: Object,
      required: true,
    },
    viewDefinition: {
      type: Object,
      required: true,
    },
    hideView: {
      type: Boolean,
    },
    hideEnter: {
      type: Boolean,
    },
    // openInNew will go to route when clicked and will open route in new when mdidle clicked
    expandMode: {
      type: String,
      default: 'openInNew',
      validator: (value) => {
        return ['emit', 'openInNew', 'openInDialog'].includes(value)
      },
    },

    btnAttrs: {},
  },

  data() {
    return {
      status: false,
      customActions: [],
    }
  },

  computed: {
    visibleCustomActions() {
      return this.customActions.filter((actionWrapper) =>
        actionWrapper.actionObject.showIf
          ? actionWrapper.actionObject.showIf(this, this.item)
          : true
      )
    },

    isActionLoading() {
      return this.customActions.some((actionWrapper) => actionWrapper.isLoading)
    },
  },

  created() {
    this.customActions = this.viewDefinition.actions
      ? this.viewDefinition.actions.map((actionObject) => ({
          isLoading: false,
          actionObject,
        }))
      : []
  },

  methods: {
    isComponentHidden(options) {
      return !!options.hideIf?.(this, this.item)
    },

    openEditDialog(mode) {
      this.$emit('handle-action-click', mode, this.item)
    },

    openExpandType(expandTypeObject, openInNew = false) {
      if (this.expandMode === 'emit')
        this.$emit('handle-expand-click', expandTypeObject)
      else if (this.expandMode === 'openInDialog')
        this.$root.$emit('openCrudRecordDialog', {
          viewDefinition: expandTypeObject.viewDefinition,
          lockedFilters: expandTypeObject.lockedFilters
            ? expandTypeObject.lockedFilters(this, this.item)
            : [],
          title: expandTypeObject.name,
          icon: expandTypeObject.icon,
          hiddenHeaders: expandTypeObject.excludeHeaders,
          excludeFilters: expandTypeObject.excludeFilters,
          hidePresets: true,
          pageOptions: {
            search: null,
            filters: expandTypeObject.initialFilters ?? [],
            sort: expandTypeObject.initialSortOptions ?? undefined,
          },
          parentItem: this.item,
        })
      else {
        this.goToRecordPage(openInNew, expandTypeObject)
      }
    },

    reloadParent() {
      this.$emit('reload-parent')
    },

    async handleCustomActionClick(actionWrapper) {
      // if the action is already in a loading state, do nothing
      if (actionWrapper.isLoading) return

      try {
        // if the action has actionOptions, open the dialog
        if (actionWrapper.actionObject.actionOptions) {
          this.$root.$emit('openExecuteActionDialog', {
            actionOptions: actionWrapper.actionObject.actionOptions,
            selectedItem: actionWrapper.actionObject.actionOptions
              .selectedItemModifier
              ? actionWrapper.actionObject.actionOptions.selectedItemModifier(
                  this,
                  this.item
                )
              : null,
            item: this.item,
          })
          return
        }

        // if the actionWrapper is already loading and it is asynchronous, prevent the action
        if (
          actionWrapper.actionObject.simpleActionOptions.isAsync &&
          actionWrapper.isLoading
        ) {
          this.$notifier.showSnackbar({
            message: 'Action currently in progress',
            variant: 'warning',
          })
          return
        }

        if (actionWrapper.actionObject.simpleActionOptions.isAsync)
          actionWrapper.isLoading = true

        if (actionWrapper.actionObject.simpleActionOptions.confirmOptions) {
          if (
            confirm(
              actionWrapper.actionObject.simpleActionOptions.confirmOptions
                ?.text ??
                `Confirm execute action: ${actionWrapper.actionObject.text}`
            )
          ) {
            await actionWrapper.actionObject.simpleActionOptions.handleClick(
              this,
              this.item
            )
          } else {
            this.$notifier.showSnackbar({
              message: 'Action cancelled',
              variant: 'warning',
            })
          }
        } else {
          await actionWrapper.actionObject.simpleActionOptions.handleClick(
            this,
            this.item
          )
        }
      } catch (err) {
        handleError(this, err)
      }

      actionWrapper.isLoading = false
    },

    goToRecordPage(openInNew) {
      enterRoute(
        this,
        generateViewRecordRoute(this, {
          routeKey: this.viewDefinition.entity.typename,
          routeType: this.viewDefinition.routeType,
          id: this.item.id,
          showComments: true,
        }),
        openInNew
      )

      this.$emit('close-parent')
    },
  },
}
</script>
