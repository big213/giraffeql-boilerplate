<template>
  <v-container v-if="loading.loadRecord || !selectedItem" fill-height>
    <v-layout align-center justify-center>
      <div v-if="loading.loadRecord">
        <span class="display-1 pl-2"
          >Loading...
          <v-progress-circular indeterminate></v-progress-circular>
        </span>
      </div>
      <div v-else>
        <span class="display-1 pl-2">{{ recordInfo.name }} Not Found</span>
      </div>
    </v-layout>
  </v-container>
  <v-container v-else fluid>
    <v-layout justify-center align-center column d-block>
      <v-row>
        <v-col v-if="isRecordMinimized" cols="12">
          <PreviewRecordChip :value="selectedItem">
            <template v-slot:rightIcon>
              <RecordActionMenu
                :record-info="recordInfo"
                :item="selectedItem"
                hide-enter
                expand-mode="emit"
                left
                offset-x
                @handle-action-click="openEditDialog"
                @handle-custom-action-click="handleCustomActionClick"
                @handle-expand-click="handleExpandClick"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" right
                    >mdi-dots-vertical</v-icon
                  >
                </template>
              </RecordActionMenu>
              <v-icon right @click="toggleRecordMinimized(false)"
                >mdi-arrow-expand</v-icon
              >
            </template>
          </PreviewRecordChip>
        </v-col>
        <v-col
          v-else
          cols="12"
          :md="isExpanded ? 4 : 6"
          class="text-center"
          :offset-md="isExpanded ? 0 : 3"
        >
          <v-card class="elevation-12">
            <component
              :is="currentInterface"
              :selected-item="selectedItem"
              :record-info="recordInfo"
              :generation="generation"
              :reset-instruction="recordResetInstruction"
              mode="view"
            >
              <template v-slot:toolbar>
                <v-toolbar flat color="accent" dense>
                  <v-icon left>{{ recordInfo.icon || 'mdi-domain' }}</v-icon>
                  <v-toolbar-title>
                    {{ recordInfo.name }}
                  </v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-btn icon @click="reset()">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                  <RecordActionMenu
                    :record-info="recordInfo"
                    :item="selectedItem"
                    hide-view
                    hide-enter
                    expand-mode="emit"
                    left
                    offset-x
                    @handle-action-click="openEditDialog"
                    @handle-custom-action-click="handleCustomActionClick"
                    @handle-expand-click="handleExpandClick"
                  ></RecordActionMenu>
                  <v-btn icon @click="toggleRecordMinimized(true)">
                    <v-icon>mdi-arrow-collapse</v-icon>
                  </v-btn>
                </v-toolbar>
              </template>
            </component>
          </v-card>
        </v-col>
        <v-col v-if="isExpanded" cols="12" :md="isRecordMinimized ? 12 : 8">
          <v-card class="elevation-12">
            <component
              :is="paginationComponent"
              :record-info="expandTypeObject.recordInfo"
              :title="expandTypeObject.name"
              :icon="expandTypeObject.icon"
              :hidden-headers="expandTypeObject.excludeHeaders"
              :locked-filters="lockedSubFilters"
              :page-options="pageOptions"
              :hidden-filters="hiddenSubFilters"
              :parent-item="selectedItem"
              dense
              @pageOptions-updated="handleSubPageOptionsUpdated"
              @reload-parent-item="handleReloadParentItem()"
            >
              <template v-slot:header-action>
                <v-btn icon @click="toggleExpand(null)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>
            </component>
          </v-card>
        </v-col>
      </v-row>
    </v-layout>
    <EditRecordDialog
      :status="dialogs.editRecord"
      :record-info="recordInfo"
      :selected-item="selectedItem"
      :mode="dialogs.editMode"
      @close="dialogs.editRecord = false"
      @handle-submit="handleSubmit"
    ></EditRecordDialog>
  </v-container>
</template>

<script>
import ViewRecordTableInterface from '~/components/interface/crud/viewRecordTableInterface.vue'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import RecordActionMenu from '~/components/menu/recordActionMenu.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  capitalizeString,
  handleError,
  serializeNestedProperty,
  processQuery,
} from '~/services/base'
import CrudRecordInterface from '~/components/interface/crud/crudRecordInterface.vue'
import { mapGetters } from 'vuex'

export default {
  components: {
    ViewRecordTableInterface,
    EditRecordDialog,
    RecordActionMenu,
    PreviewRecordChip,
  },

  props: {
    recordInfo: {
      type: Object,
      required: true,
    },
    lookupParams: {
      type: Object,
      default: () => null,
    },
    head: {
      type: Object,
      default: () => null,
    },
  },

  data() {
    return {
      selectedItem: null,
      expandTypeObject: null,
      subPageOptions: null,

      isRecordMinimized: false,

      generation: 0,

      recordResetInstruction: null,

      dialogs: {
        editRecord: false,
        editMode: 'view',
      },

      loading: {
        loadRecord: false,
      },

      recordInfoChanged: false,
    }
  },

  computed: {
    ...mapGetters({
      newUnreadNotifications: 'user/newUnreadNotifications',
    }),

    isExpanded() {
      return !!this.expandTypeObject
    },
    currentInterface() {
      return this.recordInfo.viewOptions.component || ViewRecordTableInterface
    },
    hiddenSubFilters() {
      if (!this.isExpanded) return []

      // is there an excludeFilters array on the expandTypeObject? if so, use that
      return [this.recordInfo.typename.toLowerCase() + '.id'].concat(
        this.expandTypeObject.excludeFilters ?? []
      )
    },
    lockedSubFilters() {
      if (!this.isExpanded) return []

      // is there a lockedFilters generator on the expandTypeObject? if so, use that
      if (this.expandTypeObject.lockedFilters) {
        return this.expandTypeObject.lockedFilters(this, this.selectedItem)
      }

      return [
        {
          field: this.recordInfo.typename.toLowerCase() + '.id',
          operator: 'eq',
          value: this.selectedItem.id,
        },
      ]
    },
    capitalizedTypename() {
      return capitalizeString(this.recordInfo.typename)
    },

    paginationComponent() {
      return (
        this.expandTypeObject.component ||
        this.expandTypeObject.recordInfo.paginationOptions.component ||
        CrudRecordInterface
      )
    },

    // type: CrudPageOptions | null
    pageOptions() {
      return this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
    },
  },

  watch: {
    '$route.query.e'(val) {
      this.setExpandTypeObject(val)
    },

    '$route.query.m'(val) {
      if (val) {
        this.isRecordMinimized = true
      }
    },

    recordInfo() {
      this.recordInfoChanged = true
      this.reset(true)
    },

    '$route.query.id'() {
      // if this was triggered in addition to recordInfo change, do nothing and revert recordInfoChange on next tick
      if (this.recordInfoChanged) {
        this.$nextTick(() => {
          this.recordInfoChanged = false
        })
        return
      }

      this.reset(true)
    },

    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect if there is a defaultPageOptions
      if (!val && this.recordInfo.paginationOptions.defaultPageOptions) {
        this.navigateToDefaultRoute()
      }
    },
  },

  created() {
    this.reset(true)
  },

  methods: {
    handleSubmit() {
      this.loadRecord()
      this.$emit('handle-submit')
    },

    async handleReloadParentItem() {
      if (!this.selectedItem) return

      // force reset of the table component, hiding the loader
      this.recordResetInstruction = { showLoader: false }
    },

    getChipName(item) {
      return this.recordInfo?.chipOptions?.getName
        ? this.recordInfo?.chipOptions?.getName(item)
        : item.name
    },

    getChipImage(item) {
      return this.recordInfo?.chipOptions?.getImage
        ? this.recordInfo.chipOptions.getImage(item)
        : item.avatar
    },

    handleExpandClick(expandTypeObject) {
      this.toggleExpand(expandTypeObject.key)
    },

    handleCustomActionClick(actionObject, item) {
      actionObject.handleClick(this, item)
    },

    toggleRecordMinimized(state) {
      const query = {
        ...this.$route.query,
      }

      if (state) {
        query.m = '1'
      } else {
        delete query.m
      }

      // push to route
      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)

      this.isRecordMinimized = state
    },

    toggleExpand(expandKey) {
      const query = {
        ...this.$route.query,
      }

      if (expandKey) {
        query.e = expandKey
      } else {
        delete query.e
        delete query.pageOptions
      }

      // push to route
      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)
    },

    setExpandTypeObject(expandKey, init = false) {
      // if expandKey is undefined, unset it
      if (expandKey === undefined) {
        this.expandTypeObject = null
        // also need to unset the pageOptions

        return
      }

      if (Array.isArray(this.recordInfo.expandTypes)) {
        // find the expandTypeObject with the matching key
        // if expandKey === null, set to first expandType
        const expandTypeObject =
          expandKey === null
            ? this.recordInfo.expandTypes[0]
            : this.recordInfo.expandTypes.find(
                (expandTypeObject) => expandTypeObject.key === expandKey
              )

        // if not found, return
        if (!expandTypeObject) return

        this.expandTypeObject = expandTypeObject

        // when item expanded, initialize the filters if not init, or if init and pageOptions not defined
        if (!init || (init && !this.$route.query.pageOptions)) {
          this.handleSubPageOptionsUpdated({
            search: null,
            filters: expandTypeObject.initialFilters ?? [],
            sort: expandTypeObject.initialSortOptions ?? null,
          })
        }
      }
    },

    handleSubPageOptionsUpdated(pageOptions) {
      const query = {
        ...this.$route.query,
      }

      // check if any valid options
      if (
        pageOptions &&
        (pageOptions.search || pageOptions.filters.length || pageOptions.sort)
      ) {
        query.pageOptions = encodeURIComponent(
          btoa(JSON.stringify(pageOptions))
        )
      } else {
        delete query.pageOptions
      }

      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)
      // catches if the query is exactly the same
    },

    openDialog(dialogName) {
      if (dialogName in this.dialogs) {
        this.dialogs[dialogName] = true
      }
    },

    openEditDialog(mode) {
      this.dialogs.editMode = mode
      this.openDialog('editRecord')
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        const fields = (this.recordInfo.requiredFields ?? []).concat(
          this.recordInfo.chipOptions?.fields ?? []
        )

        // if the record type has name/avatar, also fetch those
        if (this.recordInfo.hasName) fields.push('name')
        if (this.recordInfo.hasAvatar) fields.push('avatar')

        const { serializeMap, query } = processQuery(
          this,
          this.recordInfo,
          fields
        )

        const data = await executeGiraffeql(this, {
          [`get${this.capitalizedTypename}`]: {
            ...query,
            __args: {
              ...this.lookupParams,
              ...(this.$route.query.id && { id: this.$route.query.id }),
            },
          },
        })

        // remove any undefined serializeMap elements
        serializeMap.forEach((val, key) => {
          if (val === undefined) serializeMap.delete(key)
        })

        // apply serialization to results
        serializeMap.forEach((serialzeFn, field) => {
          serializeNestedProperty(data, field, serialzeFn)
        })

        this.selectedItem = data
      } catch (err) {
        this.selectedItem = null
        handleError(this, err)
      }
      this.loading.loadRecord = false
    },

    reset(hardReset = false) {
      if (hardReset) {
        // if minimize query param set, set the initial isRecordMinimized
        if (this.$route.query.m !== undefined) {
          this.isRecordMinimized = true
        }
        // must independently verify existence of item
        this.loadRecord().then(() => {
          // if expand query param set, set the initial expandTypeObject
          if (this.$route.query.e !== undefined) {
            this.setExpandTypeObject(this.$route.query.e, true)
          }
        })
      }

      this.generation++
    },
  },

  head() {
    return (
      this.head ?? {
        title: 'View ' + this.recordInfo.name,
      }
    )
  },
}
</script>
