import ViewRecordInterface from '~/components/interface/crud/viewRecordInterface.vue'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import RecordActionMenu from '~/components/menu/recordActionMenu.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import CrudPostInterface from '~/components/interface/crud/crudPostInterface.vue'
import { executeApiRequest } from '~/services/api'
import {
  capitalizeString,
  handleError,
  processRenderQuery,
} from '~/services/base'
import { generatePreviewViewDefinition } from '~/services/view'
import CrudRecordInterface from '~/components/interface/crud/crudRecordInterface.vue'
import { mapGetters } from 'vuex'

export default {
  components: {
    ViewRecordInterface,
    EditRecordDialog,
    RecordActionMenu,
    PreviewRecordChip,
  },

  props: {
    viewDefinition: {
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
      currentItem: null,
      currentParentItem: null,
      expandTypeObject: null,
      subPageOptions: null,

      generation: 0,

      recordResetInstruction: null,

      dialogs: {
        editRecord: false,
        editMode: 'view',
      },

      loading: {
        loadRecord: false,
      },

      viewDefinitionChanged: false,

      breadcrumbItems: [],

      previewExpandTypes: [],
    }
  },

  computed: {
    ...mapGetters({
      newUnreadNotifications: 'user/newUnreadNotifications',
    }),

    isChildComponent() {
      return this.breadcrumbItems.length > 1
    },

    postInterface() {
      return this.viewDefinition.postOptions?.component ?? CrudPostInterface
    },

    postLockedFilters() {
      return [
        {
          field: `${this.viewDefinition.entity.typename}.id`,
          operator: 'eq',
          value: this.currentItem.id,
        },
      ]
    },

    recordMode() {
      return this.$route.query.m === '2'
        ? 'hidden'
        : this.$route.query.m === '1'
        ? 'minimized'
        : 'show'
    },

    fullPageMode() {
      return !!this.viewDefinition.pageOptions?.fullPageMode
    },

    parentItem() {
      return this.currentParentItem || this.currentItem
    },

    isExpanded() {
      return !!this.expandTypeObject
    },

    hasComments() {
      return !!this.viewDefinition.postOptions
    },

    isExpandOrCommentsOpened() {
      return !!this.expandTypeObject || (this.showComments && this.hasComments)
    },

    showComments() {
      return this.$route.query.c !== undefined && this.hasComments
    },

    currentInterface() {
      return this.viewDefinition.viewOptions.component || ViewRecordInterface
    },

    lockedSubFilters() {
      return this.getExpandTypeSubFilters(this.expandTypeObject)
    },

    hiddenSubHeaders() {
      return this.getExpandTypeHiddenSubHeaders(this.expandTypeObject)
    },

    hiddenSubFilters() {
      return this.getExpandTypeHiddenSubFilters(this.expandTypeObject)
    },

    paginationComponent() {
      return (
        this.expandTypeObject.component ||
        this.expandTypeObject.view.paginationOptions.component ||
        CrudRecordInterface
      )
    },

    // type: CrudPageOptions | null
    pageOptions() {
      return this.$route.query.o
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.o)))
        : null
    },
  },

  watch: {
    '$route.query.e'(val) {
      this.setExpandTypeObject(val)
    },

    viewDefinition() {
      this.viewDefinitionChanged = true
      this.reset(true)
    },

    '$route.query.id'() {
      // if this was triggered in addition to viewDefinition change, do nothing and revert viewDefinitionChange on next tick
      if (this.viewDefinitionChanged) {
        this.$nextTick(() => {
          this.viewDefinitionChanged = false
        })
        return
      }
      this.reset(true)
    },
  },

  created() {
    // if legacy pageOptions param is provided, automatically replace that with o
    if (this.$route.query.pageOptions) {
      this.$router.replace({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          pageOptions: undefined,
          o: this.$route.query.pageOptions,
        },
      })
    }

    this.reset(true)

    // listen for root refresh events
    this.$root.$on('refresh-interface', this.refreshCb)
  },

  destroyed() {
    this.$root.$off('refresh-interface', this.refreshCb)
  },

  methods: {
    refreshCb(typename, { id } = {}) {
      if (this.viewDefinition.entity.typename === typename) {
        // if ID is provided and it is equal to the current currentItem id, do hard refresh
        if (id && id === this.currentItem.id) {
          this.reset(true)
        }
      }
    },

    getExpandTypeComponent(expandTypeObject) {
      return (
        expandTypeObject.component ||
        expandTypeObject.view.paginationOptions.component ||
        CrudRecordInterface
      )
    },

    getExpandTypeHiddenSubHeaders(expandTypeObject) {
      // use the childType's excludeHeaders, else default to the current typename
      return (
        expandTypeObject?.excludeHeaders ?? [
          this.viewDefinition.entity.typename,
        ]
      )
    },

    getExpandTypeSubFilters(expandTypeObject) {
      if (!expandTypeObject) return []

      // is there a lockedFilters generator on the expandTypeObject? if so, use that
      if (expandTypeObject.lockedFilters) {
        return expandTypeObject.lockedFilters(this, this.parentItem)
      }

      return [
        {
          field: `${this.viewDefinition.entity.typename}.id`,
          operator: 'eq',
          value: this.parentItem.id,
        },
      ]
    },

    getExpandTypeHiddenSubFilters(expandTypeObject) {
      if (!this.expandTypeObject) return []

      // is there an excludeFilters array on the expandTypeObject? if so, use that
      return [`${this.viewDefinition.entity.typename}.id`].concat(
        expandTypeObject.excludeFilters ?? []
      )
    },

    handleSubmit() {
      this.loadRecord()
      this.$emit('handle-submit')
    },

    async handleReloadParentItem() {
      if (!this.currentItem) return

      // force reset of the table component, hiding the loader
      this.recordResetInstruction = { showLoader: false }
    },

    handleExpandTypeUpdated(item, expandTypeObject) {
      // add to breadcrumbs

      this.breadcrumbItems.push({
        expandTypeObject,
        item,
        isRoot: false,
      })

      this.currentParentItem = item
      this.expandTypeObject = expandTypeObject

      // set the pageOptions override
      this.subPageOptions = {
        search: null,
        filters: expandTypeObject.initialFilters ?? [],
        sort: expandTypeObject.initialSortKey ?? null,
      }
    },

    handleBreadcrumbItemClick(breadcrumbItem) {
      const index = this.breadcrumbItems.indexOf(breadcrumbItem)

      if (index !== -1) {
        // apply the breadcrumb item and truncate the breadcrumb array at that index
        this.breadcrumbItems.splice(index + 1)

        const { item, expandTypeObject } = breadcrumbItem

        this.currentParentItem = item
        this.expandTypeObject = expandTypeObject

        // set the pageOptions override
        this.subPageOptions = {
          search: null,
          filters: expandTypeObject.initialFilters ?? [],
          sort: expandTypeObject.initialSortKey ?? null,
        }
      }
    },

    // replaces the breadcrumb item at index
    replaceBreadcrumbItem({ item, index }) {
      // get the expandTypeObject from the existing item at that index
      const { expandTypeObject } = this.breadcrumbItems[index]

      this.breadcrumbItems.splice(index)
      this.breadcrumbItems.push({
        expandTypeObject,
        item,
        isRoot: false,
      })
      this.currentParentItem = item
      this.expandTypeObject = expandTypeObject

      // set the pageOptions override
      this.subPageOptions = {
        search: null,
        filters: expandTypeObject.initialFilters ?? [],
        sort: expandTypeObject.initialSortKey ?? null,
      }
    },

    handleExpandClick(expandTypeObject) {
      this.handleSubPageOptionsUpdated(
        {
          search: null,
          filters: expandTypeObject.initialFilters ?? [],
          sort: expandTypeObject.initialSortKey ?? null,
        },
        expandTypeObject.key
      )
      // this.toggleExpand(expandTypeObject.key)
    },

    toggleComments(state = true) {
      const query = {
        ...this.$route.query,
      }

      if (state) {
        query.c = null
      } else {
        delete query.c
      }

      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)
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

        // if minimizing, also hide any comments
        delete query.c
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
    },

    openViewRecordDialog() {
      this.$root.$emit('openEditRecordDialog', {
        viewDefinition: this.viewDefinition,
        parentItem: {
          id: this.currentItem.id,
        },
        mode: 'view',
      })
    },

    toggleExpand(expandKey) {
      // if there are breadcrumb items, go back
      if (this.breadcrumbItems.length > 1 && !expandKey) {
        this.breadcrumbItems.pop()

        const latestItem = this.breadcrumbItems[this.breadcrumbItems.length - 1]

        this.currentParentItem = latestItem.item
        this.expandTypeObject = latestItem.expandTypeObject

        this.handleSubPageOptionsUpdated({
          search: null,
          filters: this.expandTypeObject.initialFilters ?? [],
          sort: this.expandTypeObject.initialSortKey ?? null,
        })

        return
      }

      const query = {
        ...this.$route.query,
      }

      if (expandKey) {
        query.e = expandKey
      } else {
        delete query.e
        delete query.o
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

      if (Array.isArray(this.viewDefinition.childTypes)) {
        // find the expandTypeObject with the matching key
        // if expandKey === null, set to first expandType
        const expandTypeObject =
          expandKey === null
            ? this.viewDefinition.childTypes[0]
            : this.viewDefinition.childTypes.find(
                (expandTypeObject) => expandTypeObject.key === expandKey
              )

        // if not found, return
        if (!expandTypeObject) return

        this.expandTypeObject = expandTypeObject

        // if breadcrumb mode and init, also set the initial item (reset breadcrumbs)
        if (init && this.expandTypeObject.breadcrumbOptions) {
          this.breadcrumbItems = [
            {
              expandTypeObject: this.expandTypeObject,
              item: this.currentItem,
              isRoot: true,
            },
          ]
        }

        // when item expanded, initialize the filters if not init, or if init and pageOptions not defined
        if (!init || (init && !this.$route.query.o)) {
          this.handleSubPageOptionsUpdated({
            search: null,
            filters: expandTypeObject.initialFilters ?? [],
            sort: expandTypeObject.initialSortKey ?? null,
          })
        }
      }
    },

    handleSubPageOptionsUpdated(pageOptions, expandKey) {
      // if it's a child component, set the subPageOptions
      if (this.isChildComponent) {
        this.subPageOptions = pageOptions
        return
      }

      const query = {
        ...this.$route.query,
      }

      if (expandKey) {
        query.e = expandKey
      }

      // check if any valid options
      if (
        pageOptions &&
        (pageOptions.search || pageOptions.filters.length || pageOptions.sort)
      ) {
        query.o = encodeURIComponent(btoa(JSON.stringify(pageOptions)))
      } else {
        delete query.o
      }

      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)
      // catches if the query is exactly the same
    },

    openDialog({ dialogName }) {
      if (dialogName in this.dialogs) {
        this.dialogs[dialogName] = true
        this.dialogs.parentItem = this.currentItem
      }
    },

    openEditDialog({ mode }) {
      this.dialogs.editMode = mode
      this.openDialog({ dialogName: 'editRecord' })
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        // if the record type has name/avatar, also fetch those. and any required fields
        const query = await processRenderQuery(this, {
          renderFieldDefinitions: [],
          rawFields: [
            ...(this.viewDefinition.requiredFields ?? []),
            ...(this.viewDefinition.pageOptions?.requiredFields ?? []),
            this.viewDefinition.entity.nameField,
            this.viewDefinition.entity.avatarField,
          ].filter((e) => e),
        })

        const data = await executeApiRequest({
          [`${this.viewDefinition.entity.typename}Get`]: {
            ...query,
            __args: {
              ...this.viewDefinition.pageOptions?.getLookupParams?.(this),
              ...(this.$route.query.id && { id: this.$route.query.id }),
            },
          },
        })

        this.currentItem = data
      } catch (err) {
        this.currentItem = null
        handleError(this, err)
      }
      this.loading.loadRecord = false
    },

    reset(hardReset = false) {
      if (hardReset) {
        // must independently verify existence of item
        this.loadRecord().then(() => {
          // if expand query param set, set the initial expandTypeObject
          if (this.$route.query.e !== undefined) {
            this.setExpandTypeObject(this.$route.query.e, true)
          }

          const previewExpandTypes =
            this.viewDefinition.pageOptions?.previewExpandTypes

          if (previewExpandTypes) {
            this.previewExpandTypes = previewExpandTypes
              .map((ele) =>
                this.viewDefinition.childTypes.find(
                  (expandTypeObject) => expandTypeObject.key === ele
                )
              )
              .map((expandTypeObject) => {
                // replace each viewDefinition with the previewRecordInfo
                return {
                  expandTypeObject: {
                    ...expandTypeObject,
                    viewDefinition: generatePreviewViewDefinition({
                      viewDefinition: expandTypeObject.view,
                      title: `Latest ${expandTypeObject.view.entity.pluralName}`,
                    }),
                  },
                  pageOptions: undefined,
                }
              })
          }
        })
      }

      this.generation++
    },
  },

  head() {
    return (
      this.head ?? {
        title: `View ${this.viewDefinition.entity.name}`,
      }
    )
  },
}
