import ViewRecordInterface from '~/components/interface/crud/viewRecordInterface.vue'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import RecordActionMenu from '~/components/menu/recordActionMenu.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import CrudPostInterface from '~/components/interface/crud/crudPostInterface.vue'
import { executeGiraffeql } from '~/services/giraffeql'
import { capitalizeString, handleError, processQuery } from '~/services/base'
import { generatePreviewRecordInfo } from '~/services/recordInfo'
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
      selectedItem: null,
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
          field: this.viewDefinition.entity.typename,
          operator: 'eq',
          value: this.selectedItem.id,
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
      return this.currentParentItem || this.selectedItem
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
    hiddenSubFilters() {
      if (!this.isExpanded) return []

      return this.getExpandTypeHiddenSubFilters(this.expandTypeObject)
    },
    lockedSubFilters() {
      if (!this.isExpanded) return []

      return this.getExpandTypeSubFilters(this.expandTypeObject)
    },
    capitalizedTypename() {
      return capitalizeString(this.viewDefinition.entity.typename)
    },

    paginationComponent() {
      return (
        this.expandTypeObject.component ||
        this.expandTypeObject.viewDefinition.paginationOptions.component ||
        CrudRecordInterface
      )
    },

    // type: CrudPageOptions | null
    pageOptions() {
      return this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
    },

    hideBreadcrumbs() {
      return !!this.expandTypeObject?.breadcrumbOptions?.hideBreadcrumbs
    },

    hideActions() {
      return this.viewDefinition.pageOptions?.hideActions
    },

    hideRefresh() {
      return this.viewDefinition.pageOptions?.hideRefresh
    },

    hideMinimize() {
      return this.viewDefinition.pageOptions?.hideMinimize
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

    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect if there is a defaultPageOptions
      if (!val && this.viewDefinition.paginationOptions.defaultPageOptions) {
        this.navigateToDefaultRoute()
      }
    },
  },

  created() {
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
        // if ID is provided and it is equal to the current selectedItem id, do hard refresh
        if (id && id === this.selectedItem.id) {
          this.reset(true)
        }
      }
    },

    getExpandTypeComponent(expandTypeObject) {
      return (
        expandTypeObject.component ||
        expandTypeObject.viewDefinition.paginationOptions.component ||
        CrudRecordInterface
      )
    },

    getExpandTypeSubFilters(expandTypeObject) {
      // is there a lockedFilters generator on the expandTypeObject? if so, use that
      if (expandTypeObject.lockedFilters) {
        return expandTypeObject.lockedFilters(this, this.parentItem)
      }

      return [
        {
          field: this.viewDefinition.entity.typename.toLowerCase() + '.id',
          operator: 'eq',
          value: this.parentItem.id,
        },
      ]
    },

    getExpandTypeHiddenSubFilters(expandTypeObject) {
      // is there an excludeFilters array on the expandTypeObject? if so, use that
      return [this.viewDefinition.entity.typename.toLowerCase() + '.id'].concat(
        expandTypeObject.excludeFilters ?? []
      )
    },

    handleSubmit() {
      this.loadRecord()
      this.$emit('handle-submit')
    },

    async handleReloadParentItem() {
      if (!this.selectedItem) return

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
        sort: expandTypeObject.initialSortOptions ?? null,
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
          sort: expandTypeObject.initialSortOptions ?? null,
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
        sort: expandTypeObject.initialSortOptions ?? null,
      }
    },

    handleExpandClick(expandTypeObject) {
      this.handleSubPageOptionsUpdated(
        {
          search: null,
          filters: expandTypeObject.initialFilters ?? [],
          sort: expandTypeObject.initialSortOptions ?? null,
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
        selectedItem: {
          id: this.selectedItem.id,
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
          sort: this.expandTypeObject.initialSortOptions ?? null,
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
              item: this.selectedItem,
              isRoot: true,
            },
          ]
        }

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
        const fields = (this.viewDefinition.requiredFields ?? []).concat(
          this.viewDefinition.pageOptions?.fields ?? []
        )

        // if the record type has name/avatar, also fetch those
        if (this.viewDefinition.entity.nameField) fields.push('name')
        if (this.viewDefinition.entity.avatarField) fields.push('avatarUrl')

        const { query } = await processQuery(
          this,
          this.viewDefinition,
          fields,
          true
        )

        const data = await executeGiraffeql({
          [`get${this.capitalizedTypename}`]: {
            ...query,
            __args: {
              ...this.lookupParams,
              ...(this.$route.query.id && { id: this.$route.query.id }),
            },
          },
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
                    viewDefinition: generatePreviewRecordInfo({
                      viewDefinition: expandTypeObject.viewDefinition,
                      title: `Latest ${expandTypeObject.viewDefinition.entity.pluralName}`,
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
