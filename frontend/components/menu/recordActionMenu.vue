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
          viewDefinition.updateOptions.text || 'Edit'
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
      <template v-if="visibleActions.length > 0">
        <v-divider></v-divider>
        <v-list-item
          v-for="(actionInputObject, i) in visibleActions"
          :key="`ca${i}`"
          dense
          @click="handleActionClick(actionInputObject)"
        >
          <v-list-item-icon>
            <v-progress-circular
              v-if="actionInputObject.isLoading"
              size="24"
              indeterminate
            ></v-progress-circular>
            <v-icon v-else>{{
              actionInputObject.actionObject.icon ??
              actionInputObject.actionObject.action.icon
            }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title
            >{{
              actionInputObject.actionObject.text ??
              actionInputObject.actionObject.action.title
            }}
          </v-list-item-title>
        </v-list-item>
      </template>

      <v-divider v-if="visibleChildTypes.length"></v-divider>
      <v-list-item
        v-for="(expandObject, i) in visibleChildTypes"
        :key="i"
        dense
        @click="openExpandType(expandObject)"
        @click.middle="openExpandType(expandObject, true)"
      >
        <v-list-item-icon>
          <v-icon>{{
            expandObject.icon ?? expandObject.view.entity.icon
          }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title
          >{{ expandObject.name ?? expandObject.view.entity.name }}
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
import { handleError, enterRoute } from '~/services/base'
import { generateViewRecordRoute } from '~/services/route'

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
      actionInputObjects: [],
    }
  },

  computed: {
    visibleActions() {
      return this.actionInputObjects.filter((actionInputObject) =>
        actionInputObject.actionObject.showIf
          ? actionInputObject.actionObject.showIf(this, this.item)
          : true
      )
    },

    visibleChildTypes() {
      return (
        this.viewDefinition.childTypes?.filter(
          (expandTypeObject) => !expandTypeObject.hideIf?.(this, this.item)
        ) ?? []
      )
    },

    isActionLoading() {
      return this.actionInputObjects.some(
        (actionInputObject) => actionInputObject.isLoading
      )
    },
  },

  created() {
    this.actionInputObjects = this.viewDefinition.actions
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
      this.$emit('handle-action-click', {
        mode,
        parentItem: this.item,
      })
    },

    openExpandType(expandTypeObject, openInNew = false) {
      if (this.expandMode === 'emit')
        this.$emit('handle-expand-click', expandTypeObject)
      else if (this.expandMode === 'openInDialog')
        this.$root.$emit('openCrudRecordDialog', {
          viewDefinition: expandTypeObject.view,
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
            sort: expandTypeObject.initialSortKey ?? undefined,
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

    async handleActionClick(actionInputObject) {
      // if the action is already in a loading state, do nothing
      if (actionInputObject.isLoading) return

      const simpleActionOptions =
        actionInputObject.actionObject.simpleActionOptions
      const actionOptions = actionInputObject.actionObject.action

      const actionName =
        actionInputObject.actionObject.text ??
        actionInputObject.actionObject.action.title

      try {
        // if neither simpleActionOptions nor actionOptions are defined, throw err
        if (!simpleActionOptions && !actionOptions) {
          throw new Error(
            'Action does not have a defined simpleAction or action'
          )
        }

        // if the action has actionOptions, open the dialog
        if (actionOptions) {
          this.$root.$emit('openExecuteActionDialog', {
            action: actionInputObject.actionObject.action,
            parentItem: this.item,
          })
          return
        }

        // if the actionInputObject is already loading and it is asynchronous, prevent the action
        if (simpleActionOptions.isAsync && actionInputObject.isLoading) {
          this.$root.$emit('showSnackbar', {
            message: `Action currently in progress`,
            color: 'warning',
          })
          return
        }

        if (simpleActionOptions.isAsync) {
          actionInputObject.isLoading = true
        }

        if (simpleActionOptions.confirmOptions) {
          if (
            confirm(
              simpleActionOptions.confirmOptions?.text ??
                `Confirm execute action: ${actionName}`
            )
          ) {
            await simpleActionOptions.handleClick(this, this.item)
          } else {
            this.$root.$emit('showSnackbar', {
              message: `Action cancelled`,
              color: 'warning',
            })
          }
        } else {
          await simpleActionOptions.handleClick(this, this.item)
        }
      } catch (err) {
        handleError(this, err)
      }

      actionInputObject.isLoading = false
    },

    goToRecordPage(openInNew) {
      enterRoute(
        this,
        generateViewRecordRoute(this, {
          viewDefinition: this.viewDefinition,
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
