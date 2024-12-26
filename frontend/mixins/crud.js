import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import SearchDialog from '~/components/dialog/searchDialog.vue'
import RecordActionMenu from '~/components/menu/recordActionMenu.vue'
import GenericInput from '~/components/input/genericInput.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import CircularLoader from '~/components/common/circularLoader.vue'
import Hero from '~/components/interface/crud/hero/hero.vue'
import {
  getNestedProperty,
  generateTimeAgoString,
  capitalizeString,
  isObject,
  getCurrentDate,
  downloadCSV,
  handleError,
  getPaginatorData,
  collectPaginatorData,
  viewportToPixelsMap,
  lookupRenderField,
  populateInputObject,
  processQuery,
  generateFilterByObjectArray,
  collapseObject,
  generateCrudRecordRoute,
  camelCaseToCapitalizedString,
} from '~/services/base'
import { defaultGridView } from '~/services/config'
import { executeApiRequest } from '~/services/api'

export default {
  name: 'CrudRecordInterface',

  components: {
    EditRecordDialog,
    SearchDialog,
    RecordActionMenu,
    GenericInput,
    PreviewRecordChip,
    CircularLoader,
  },

  props: {
    // replacement title to override default one
    elementTitle: {
      type: String,
    },
    // replacement icon
    icon: {
      type: String,
    },
    viewDefinition: {
      required: true,
    },
    // header fields that should be hidden
    hiddenHeaders: {
      type: Array,
    },
    // type: CrudPageOptions | null | undefined
    pageOptions: {
      type: Object,
    },
    /** raw filters must also be in viewDefinition.filters. appended directly to the filterBy params. also applied to addRecordDialog
    {
      field: string;
      operator: string;
      value: any;
    }
    */
    lockedFilters: {
      type: Array,
    },
    // array of filter keys (viewDefinition.filters) that should be hidden
    // string[]
    hiddenFilters: {
      type: Array,
      default: () => [],
    },
    isChildComponent: {
      type: Boolean,
      default: false,
    },
    dense: {
      type: Boolean,
      default: false,
    },
    pollInterval: {
      type: Number,
      default: 0,
    },
    // is this component being rendered inside a dialog
    isDialog: {
      type: Boolean,
      default: false,
    },
    // if it is a child component, the parent component with at least id
    parentItem: {
      type: Object,
    },

    resultsPerPage: {
      type: Number,
      default: 12,
    },

    // should the preset filters be hidden?
    hidePresets: {
      type: Boolean,
      default: false,
    },

    // use the breadcrumb mode?
    breadcrumbMode: {
      type: Boolean,
    },

    // hide the breadcrumbs in breadcrumb mode?
    hideBreadcrumbs: {
      type: Boolean,
    },

    breadcrumbItems: {
      type: Array,
      default: () => [],
    },

    // all of the expandTypes from the parent, if any
    parentExpandTypes: {
      type: Array,
    },

    // current expand type key selected
    currentExpandTypeKey: {
      type: String,
    },

    hideParentExpandTypes: {
      type: Boolean,
    },
  },

  data() {
    return {
      isGrid: false,

      // type: CrudSortObject | null
      currentSortObject: null,

      // type: CrudFilterObject[]
      filterInputsArray: [],
      distanceFilterOptions: [],
      filterChanged: false,
      showFilterInterface: false,

      searchInput: '',

      // have the params changed since reset?
      isChanged: false,

      dialogs: {
        editRecord: false,
        expandRecord: false,
        selectedItem: null,
        editMode: 'view',
        customFields: null,
      },

      loading: {
        loadData: false,
        loadMore: false,
        syncData: false,
        exportData: false,
      },

      reloadGeneration: 0,

      // has the viewDefinition been changed?
      cancelPageOptionsReset: false,

      // has reset been called on this tick already?
      resetCalledOnTick: false,

      records: [],
      totalRecords: 0,
      endCursor: null,

      pollIntervalTimer: null,
      isPolling: false,
      inactivityTimer: null,

      currentPaginatorInfo: null,

      // expandable
      expandedItems: [],
      expandedItem: null,
      subPageOptions: null,
      subBreadcrumbItems: [],
      expandTypeObject: null,
    }
  },

  computed: {
    parentExpandTypesComputed() {
      return this.parentExpandTypes?.filter(
        (ele) => !ele.hideIf?.(this, this.parentItem)
      )
    },

    isDataLoading() {
      return (
        this.loading.loadData || this.loading.loadMore || this.loading.syncData
      )
    },

    // type: SortOption[]
    sortOptions() {
      return this.viewDefinition.paginationOptions.sortOptions ?? []
    },

    // if this.hiddenHeaders is defined, override the default exclude headers on the viewDefinition.paginationOptions
    hiddenHeadersComputed() {
      return (
        this.hiddenHeaders ??
        this.viewDefinition.paginationOptions.excludeHeaders ??
        []
      )
    },

    // on grid modes, the list of actions/expandTypes to be rendered as their own block buttons
    renderedExpandItems() {
      if (!this.isGrid) return []

      return this.viewDefinition.childTypes.filter((e) => e.showRowIfGrid)
    },

    // type: viewDefinition.paginationOptions.headers to CrudHeaderObject[]
    headerOptions() {
      const headerOptions = this.viewDefinition.paginationOptions.headerOptions
        .filter(
          (headerInfo) => !this.hiddenHeadersComputed.includes(headerInfo.field)
        )
        .filter((headerInfo) => {
          // if there is a hideIf function, check it
          if (headerInfo.hideIf && headerInfo.hideIf(this)) return false

          // if hideIfGrid/hideIfList, check it
          if (headerInfo.hideIfGrid && this.isGrid) return false

          if (headerInfo.hideIfList && !this.isGrid) return false

          // if isDialog, hide column if isDialog === true
          if (this.isDialog && headerInfo.hideIfDialog) return false

          // allow if no hideUnder
          if (!headerInfo.hideUnder) return true

          // filter out if current viewport is less than the specified hideUnder
          return (
            viewportToPixelsMap[this.$vuetify.breakpoint.name] >=
            viewportToPixelsMap[headerInfo.hideUnder]
          )
        })
        .map((headerInfo, index) => {
          const fieldInfo = lookupRenderField(
            this.viewDefinition,
            headerInfo.field
          )

          const primaryField = fieldInfo.fields
            ? fieldInfo.fields[0]
            : headerInfo.field

          return {
            text:
              fieldInfo.text ?? camelCaseToCapitalizedString(headerInfo.field),
            align: headerInfo.align ?? 'left',
            value: primaryField,
            sortable: false,
            width: headerInfo.width ?? null,
            fieldInfo,
            hideTitleIfGrid: headerInfo.hideTitleIfGrid ?? false,
            // equal to pathPrefix if provided
            // else equal to the field if single-field
            // else equal to null if multiple-field
            path:
              fieldInfo.pathPrefix ??
              (fieldInfo.fields && fieldInfo.fields.length > 1
                ? null
                : primaryField),
          }
        })
        .concat(
          this.isGrid || this.viewDefinition.paginationOptions.hideActions
            ? []
            : {
                text: 'Actions',
                value: null,
                width: '50px',
                sortable: false,
                ...this.viewDefinition.paginationOptions.headerActionOptions,
              }
        )

      // if no headerOption has null width, set the first one to null width
      if (
        headerOptions.length &&
        !headerOptions.some((headerInfo) => !headerInfo.width)
      ) {
        headerOptions[0].width = null
      }

      return headerOptions
    },

    // type: CrudRawFilterObject[]
    rawFilters() {
      return this.pageOptions?.filters ?? []
    },

    allFilters() {
      return this.rawFilters.concat(this.lockedFiltersComputed)
    },

    lockedFiltersComputed() {
      // if lockedFilters is undefined, attempt to fetch defaultLockedFilters
      if (this.lockedFilters) return this.lockedFilters

      if (this.viewDefinition.paginationOptions.defaultLockedFilters)
        return this.viewDefinition.paginationOptions.defaultLockedFilters(this)

      return []
    },

    search() {
      return this.pageOptions?.search
    },

    childInterfaceComponent() {
      return this.expandTypeObject
        ? this.expandTypeObject.component ||
            this.expandTypeObject.viewDefinition.paginationOptions.component ||
            'CrudRecordInterface'
        : null
    },

    heroComponent() {
      return (
        this.viewDefinition.paginationOptions.heroOptions?.component ?? Hero
      )
    },

    capitalizedType() {
      return capitalizeString(this.viewDefinition.entity.typename)
    },
    visibleFiltersArray() {
      return this.filterInputsArray.filter(
        (ele) => !this.hiddenFilters.includes(ele.filterObject.field)
      )
    },
    visiblePresetFiltersArray() {
      return this.filterInputsArray.filter(
        (ele) =>
          ele.filterObject.preset &&
          !this.hiddenFilters.includes(ele.filterObject.field)
      )
    },

    visibleChipsFiltersArray() {
      return this.filterInputsArray.filter(
        (ele) =>
          ele.filterObject.chipOptions &&
          !this.hiddenFilters.includes(ele.filterObject.field)
      )
    },

    visibleRawFiltersArray() {
      return this.rawFilters.filter(
        (ele) => !this.hiddenFilters.includes(ele.field)
      )
    },

    hasNested() {
      return this.viewDefinition.childTypes
        ? !!this.viewDefinition.childTypes.length
        : false
    },

    // expanded
    lockedSubFilters() {
      if (!this.expandTypeObject) return []

      // is there a lockedFilters generator on the expandTypeObject? if so, use that
      if (this.expandTypeObject.lockedFilters) {
        return this.expandTypeObject.lockedFilters(this, this.expandedItem)
      }

      return [
        {
          field: this.viewDefinition.entity.typename.toLowerCase() + '.id',
          operator: 'eq',
          value: this.expandedItem.id,
        },
      ]
    },

    hiddenSubFilters() {
      if (!this.expandedItems.length) return []

      // is there an excludeFilters array on the expandTypeObject? if so, use that
      return [this.viewDefinition.entity.typename.toLowerCase() + '.id'].concat(
        this.expandTypeObject.excludeFilters ?? []
      )
    },

    visibleFiltersCount() {
      return this.visibleRawFiltersArray.length + (this.search ? 1 : 0)
    },

    hasFilters() {
      return (
        this.viewDefinition.paginationOptions.filterOptions?.length ||
        this.viewDefinition.paginationOptions.distanceFilterOptions?.length >
          0 ||
        this.viewDefinition.paginationOptions.searchOptions
      )
    },

    hasPresetFilters() {
      return (
        this.viewDefinition.paginationOptions.filterOptions.filter(
          (e) => e.preset
        ).length > 0 ||
        this.viewDefinition.paginationOptions.searchOptions?.preset
      )
    },

    isXsViewport() {
      return this.$vuetify.breakpoint.name === 'xs'
    },

    gridColsObject() {
      return (
        this.viewDefinition.paginationOptions.gridOptions?.colsObject ?? {
          sm: 6,
          md: 4,
          lg: 3,
        }
      )
    },

    hideAddButton() {
      return this.viewDefinition.createOptions?.hideIf?.(this)
    },
  },

  watch: {
    isPolling(val, prevVal) {
      if (val === prevVal) return
      if (val) {
        this.startPolling()
      } else {
        this.stopPolling()
      }
    },

    '$vuetify.breakpoint.name'(value) {
      if (value === 'xs') {
        // when switching to mobile view, un-expand all
        this.closeExpandedItems?.()
      }
    },

    // this should trigger mainly when switching routes on admin pages
    viewDefinition() {
      this.cancelPageOptionsReset = true

      this.$nextTick(() => {
        this.cancelPageOptionsReset = false
      })

      this.reset({
        initFilters: true,
        resetSort: true,
        resetCursor: true,
        syncGridOptions: true,
        resetChanged: true,
      })
    },

    // this should trigger if the locked filters gets updated, but only if they are different from before
    lockedFilters(val, prev) {
      // if value is effectively unchanged, do nothing
      if (JSON.stringify(prev) === JSON.stringify(val)) {
        return
      }

      this.cancelPageOptionsReset = true

      this.$nextTick(() => {
        this.cancelPageOptionsReset = false
      })

      this.reset({
        initFilters: true,
        resetSort: true,
        resetCursor: true,
      })
    },

    // this triggers when pageOptions get updated on parent element
    // this also triggers when parent element switches to a different item
    pageOptions(val, prev) {
      // if pageOptions is effectively unchanged, do nothing
      if (JSON.stringify(prev) === JSON.stringify(val)) {
        return
      }

      // if this was triggered due to a viewDefinition change, do nothing and revert viewDefinitionChange on next tick
      if (this.cancelPageOptionsReset) {
        this.$nextTick(() => {
          this.cancelPageOptionsReset = false
        })
        return
      }

      this.reset({
        resetCursor: true,
        resetSort: true,
      })
    },

    // if the dialog to expand record is closed, also unset the expandTypeObject
    'dialogs.expandRecord'(val) {
      if (!val) this.expandTypeObject = null
    },
  },

  created() {
    if (this.pollInterval > 0) {
      this.isPolling = true
    }

    this.reset({
      initFilters: true,
      syncGridOptions: true,
    })

    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
      false
    )

    // listen for root refresh events
    this.$root.$on('refresh-interface', this.refreshCb)

    // if the viewMoreOptions button is , and infiniteScroll is falsey, do nothing
    if (
      this.viewDefinition.paginationOptions.infiniteScroll &&
      (!this.viewDefinition.paginationOptions.hideViewMoreOptions ||
        this.viewDefinition.paginationOptions.hideViewMoreOptions
          .infiniteScroll)
    ) {
      window.addEventListener('scroll', this.handleInfiniteScroll)
    }

    // run any onSuccess functions
    const onSuccess = this.viewDefinition.paginationOptions.onSuccess
    if (onSuccess) {
      onSuccess(this)
    }
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleInfiniteScroll)

    this.stopPolling()
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    )

    this.$root.$off('refresh-interface', this.refreshCb)
  },

  methods: {
    generateTimeAgoString,
    getNestedProperty,

    isShowExpandButton(item, expandObject) {
      return !expandObject.hideIf?.(this, item)
    },

    applyChipFilter(inputObject, value) {
      inputObject.value = value
      this.updatePageOptions()
    },

    throttle(callback, ms = 1000) {
      if (this._throttleScroll) return
      this._throttleScroll = true
      setTimeout(() => {
        callback()
        this._throttleScroll = false
      }, ms)
    },

    handleInfiniteScroll() {
      this.throttle(() => {
        const endOfPage =
          window.innerHeight + window.pageYOffset >= document.body.offsetHeight
        if (endOfPage) {
          this.loadMore()
        }
      }, 1000)
    },

    refreshCb(typename, { refreshParent = false, id, refreshType } = {}) {
      // if type of refresh is not defined or 'crud', refresh
      if (
        this.viewDefinition.entity.typename === typename &&
        (!refreshType || refreshType === 'crud')
      ) {
        // if ID is provided, only reload that specific record
        if (id) {
          this.reloadRecord(id)
        } else {
          // otherwise, reset all records
          this.reset({
            resetExpanded: true,
          })
        }

        // if refreshParent is provided and there is a parentItem, reload and merge that record as well
        if (refreshParent && this.parentItem) {
          this.$emit('reload-parent-item')
        }
      }
    },

    toggleGridMode() {
      this.isGrid = !this.isGrid
    },

    handleClearSearch() {
      this.searchInput = ''
      this.updatePageOptions()
    },

    setCurrentSortOption(sortOption) {
      this.isChanged = true
      this.currentSortObject = sortOption
      this.updatePageOptions()
    },

    resetInactivityTimer(startInactivityTimer = true) {
      clearTimeout(this.inactivityTimer)
      if (startInactivityTimer)
        this.inactivityTimer = setTimeout(
          this.handleInactiveState,
          30 * 60 * 1000
        )
    },

    handleInactiveState() {
      // when inactive for more than 30 mins, pause polling.
      this.isPolling = false
    },

    startPolling() {
      // set the interval for refreshing, if pollInterval > 0 and not polling
      if (this.pollInterval > 0 && !this.pollIntervalTimer) {
        this.pollIntervalTimer = setInterval(() => {
          this.reset({
            showLoader: false,
            clearRecords: false,
          })
        }, this.pollInterval)

        document.addEventListener('mousemove', this.resetInactivityTimer, false)
        document.addEventListener('keydown', this.resetInactivityTimer, false)
      }
    },

    stopPolling() {
      clearInterval(this.pollIntervalTimer)
      this.pollIntervalTimer = null

      document.removeEventListener('mousemove', this.resetInactivityTimer)
      document.removeEventListener('keydown', this.resetInactivityTimer)
    },

    handleVisibilityChange() {
      if (!this.isPolling) return
      if (document.hidden) {
        // clear the pollIntervalTimer
        this.stopPolling()
        // stop checking for inactive state
        this.resetInactivityTimer(false)
      } else {
        // start the pollIntervalTimer again
        this.startPolling()
        // start checking for inactivity again
        this.resetInactivityTimer(true)
      }
    },

    handleSearchDialogSubmit(searchInput) {
      this.searchInput = searchInput
      this.updatePageOptions()
    },

    handleCustomActionClick(actionObject, item) {
      actionObject.handleClick(this, item)
    },

    // expanded
    handleSubPageOptionsUpdated(pageOptions) {
      this.subPageOptions = pageOptions
    },

    handleExpandTypeUpdated(item, expandTypeObject) {
      // add to breadcrumbs
      this.subBreadcrumbItems.push({
        expandTypeObject,
        item,
        isRoot: false,
      })

      this.currentParentItem = item
      this.expandTypeObject = expandTypeObject
    },

    handleParentExpandTypeUpdated(expandTypeObject) {
      this.$emit('parent-expand-type-updated', expandTypeObject)
    },

    // toggle the expand state. if it is mobile view (or forceDialog), use dialog
    toggleItemExpanded(props, expandTypeObject) {
      // if this item is already expanded, do nothing
      if (
        this.expandTypeObject === expandTypeObject &&
        props.item === this.expandedItem
      ) {
        // this.closeExpandedItems()
        return
      }

      // if breadcrumb mode, open the expand in the same interface
      if (expandTypeObject.breadcrumbOptions) {
        this.expandTypeObject = expandTypeObject
        this.expandedItem = props.item

        this.$emit('expand-type-updated', props.item, expandTypeObject)

        // update the pageOptions
        this.$emit('pageOptions-updated', {
          search: null,
          filters: expandTypeObject.initialFilters ?? [],
          sort: expandTypeObject.initialSortKey ?? null,
        })
        this.filterChanged = false

        return
      }

      if (props.isMobile || expandTypeObject.forceDialog) {
        this.openExpandDialog(props.item, expandTypeObject)
      } else {
        this.openExpandContainer(props, expandTypeObject)
      }
    },

    toggleGridExpand(item, expandTypeObject) {
      // if breadcrumb mode, open the expand in the same interface
      if (expandTypeObject.breadcrumbOptions) {
        this.$emit('expand-type-updated', item, expandTypeObject)
      } else {
        this.openExpandDialog(item, expandTypeObject)
      }
    },

    openExpandContainer(props, expandTypeObject) {
      this.expandTypeObject = expandTypeObject

      this.expandedItem = props.item

      // if switching to different expandRecordInfo when already expanded, do not toggle expand
      if (!props.isExpanded || !expandTypeObject)
        props.expand(!props.isExpanded)

      // when item expanded, reset the pageOptions
      if (expandTypeObject) {
        this.subPageOptions = {
          search: null,
          filters: expandTypeObject.initialFilters ?? [],
          sort: expandTypeObject.initialSortKey ?? null,
        }
      }
    },

    // same as openExpandContainer, but for mobile views
    openExpandDialog(item, expandTypeObject) {
      this.expandTypeObject = expandTypeObject
      this.expandedItem = item

      this.dialogs.expandRecord = true

      if (expandTypeObject) {
        this.subPageOptions = {
          search: null,
          filters: expandTypeObject.initialFilters ?? [],
          sort: expandTypeObject.initialSortKey ?? null,
        }
      }
    },

    goUpOneLevel() {
      // if only 1 element remaining, do nothing
      if (this.breadcrumbItems.length < 2) return

      this.$emit(
        'breadcrumb-item-click',
        this.breadcrumbItems[this.breadcrumbItems.length - 2]
      )
    },

    closeExpandedItems() {
      this.expandTypeObject = null
      this.expandedItem = null
      this.expandedItems.pop()
    },

    handleRowClick(props) {
      if (this.viewDefinition.paginationOptions.handleRowClick)
        this.viewDefinition.paginationOptions.handleRowClick(this, props)
    },

    handleGridElementClick(item) {
      if (this.viewDefinition.paginationOptions.handleGridElementClick)
        this.viewDefinition.paginationOptions.handleGridElementClick(this, item)
    },

    getTableRowData(headerItem, item) {
      // need to go deeper if nested
      return getNestedProperty(item, headerItem.value)
    },

    generatePaginatorArgs(pagination = true) {
      const sortBy = (
        this.currentSortObject
          ? [
              {
                field: this.currentSortObject.field,
                desc: this.currentSortObject.desc,
              },
            ]
          : []
      ).concat(this.currentSortObject?.additionalSortObjects ?? [])

      const getSearchParams =
        this.viewDefinition.paginationOptions.searchOptions?.getParams

      // build the distanceParams, if any
      let distanceParams
      if (this.distanceFilterOptions.length > 0) {
        distanceParams = this.distanceFilterOptions.reduce(
          (total, distanceObject) => {
            // if the gt/lt is not defined, skip
            if (!distanceObject.ltValue && !distanceObject.gtValue) return total
            // if the key already exists, overrite at this point
            total[distanceObject.definition.key] = {
              ...(distanceObject.ltValue && {
                lt: distanceObject.ltValue,
              }),
              ...(distanceObject.gtValue && {
                gt: distanceObject.gtValue,
              }),
              from: {
                latitude: distanceObject.latitudeValue,
                longitude: distanceObject.longitudeValue,
              },
            }

            return total
          },
          {}
        )
      }

      return {
        ...(pagination && {
          first:
            (this.isChanged === false
              ? this.viewDefinition.paginationOptions.limitOptions
                  ?.maxInitialRecords
              : null) ??
            this.viewDefinition.paginationOptions.resultsPerPage ??
            this.resultsPerPage,
          after: this.endCursor ?? undefined,
        }),
        sortBy,
        filterBy: generateFilterByObjectArray(this.allFilters),
        ...(distanceParams && {
          distance: distanceParams,
        }),
        ...(this.search && {
          search: {
            query: this.search,
            params: getSearchParams
              ? getSearchParams(this, this.search)
              : undefined,
          },
        }),
      }
    },

    async exportData() {
      this.loading.exportData = true
      try {
        // fields required
        if (!this.viewDefinition.paginationOptions.downloadOptions.fields) {
          throw new Error(`Downloads not configured for this record type`)
        }

        const query = collapseObject(
          this.viewDefinition.paginationOptions.downloadOptions.fields.reduce(
            (total, fieldObject) => {
              // if args has hideIf and if it returns false, skip this field entirely
              if (!fieldObject.hideIf && fieldObject.hideIf(this)) return total

              if (fieldObject.args) {
                // else add the args
                fieldObject.args.forEach((argObject) => {
                  total[`${argObject.path}.__args`] = argObject.getArgs(this)
                })
              }

              total[fieldObject.field] = true
              return total
            },
            {}
          )
        )

        // fetch data
        const results = await collectPaginatorData(
          this,
          'get' + this.capitalizedType + 'Paginator',
          query,
          this.generatePaginatorArgs(false)
        )

        // extract data from results
        const data = results.map((item) => {
          const returnItem = {}

          this.viewDefinition.paginationOptions.downloadOptions.fields.forEach(
            (fieldObject) => {
              // skip if hideIf returns true
              if (fieldObject.hideIf && fieldObject.hideIf(this)) {
                return
              }

              returnItem[fieldObject.field] = getNestedProperty(
                item,
                fieldObject.field
              )
            }
          )

          return returnItem
        })

        if (data.length < 1) {
          throw new Error('No results to export')
        }

        // download as CSV
        downloadCSV(
          this,
          data,
          `Export${this.capitalizedType}${getCurrentDate()}`
        )
      } catch (err) {
        handleError(this, err)
      }
      this.loading.exportData = false
    },

    updatePageOptions() {
      this.isChanged = true
      this.$emit('pageOptions-updated', {
        search: this.searchInput?.trim(),
        filters: this.filterInputsArray
          .filter(
            (crudFilterObject) =>
              crudFilterObject.inputObject.value !== null &&
              crudFilterObject.inputObject.value !== undefined
          )
          .map((crudFilterObject) => ({
            field: crudFilterObject.filterObject.field,
            operator: crudFilterObject.filterObject.operator,
            // if object, must be from return-object. get the id
            value: isObject(crudFilterObject.inputObject.value)
              ? crudFilterObject.inputObject.value.id
              : crudFilterObject.inputObject.value,
          })),
        distance: this.distanceFilterOptions
          .filter(
            (crudDistanceObject) =>
              !Object.values(crudDistanceObject).some(
                (ele) => ele === null || ele === undefined
              )
          )
          .map((crudDistanceObject) => ({
            key: crudDistanceObject.definition.key,
            latitude: crudDistanceObject.latitudeValue,
            longitude: crudDistanceObject.longitudeValue,
            gt: crudDistanceObject.gtValue,
            lt: crudDistanceObject.ltValue,
          })),
        sort: this.currentSortObject?.key ?? null,
      })
      this.filterChanged = false
    },

    handleAddButtonClick() {
      if (this.viewDefinition.createOptions.customAction) {
        this.viewDefinition.createOptions.customAction(this, this.parentItem)
      } else {
        this.openAddRecordDialog()
      }
    },

    openAddRecordDialog() {
      const initializedRecord = this.lockedFiltersComputed.reduce(
        (total, crudFilterObject) => {
          total[crudFilterObject.field] = crudFilterObject.value
          return total
        },
        {}
      )

      this.openEditDialog('create', initializedRecord)
    },

    openImportRecordDialog() {
      const initializedRecord = this.lockedFiltersComputed.reduce(
        (total, crudFilterObject) => {
          total[crudFilterObject.field] = crudFilterObject.value
          return total
        },
        {}
      )

      this.openEditDialog('import', initializedRecord)
    },

    openEditItemDialog(selectedItem, customFields) {
      this.openEditDialog('update', selectedItem, customFields)
    },

    openEditDialog(mode, selectedItem, customFields) {
      this.dialogs.editMode = mode
      this.openDialog('editRecord', selectedItem, customFields)
    },

    openDialog(dialogName, item, customFields) {
      if (dialogName in this.dialogs) {
        this.dialogs[dialogName] = true
        this.dialogs.selectedItem = item
        this.dialogs.customFields = customFields
      }
    },

    handleViewAllButtonClick() {
      // if limitOptions.handleViewAllButtonClick not set, automatically use the viewDefinition.paginationOptions
      if (
        !this.viewDefinition.paginationOptions.limitOptions
          .handleViewAllButtonClick
      ) {
        this.$router.push(
          generateCrudRecordRoute(this, {
            routeType: this.viewDefinition.routeType,
            typename: this.viewDefinition.entity.typename,
            pageOptions:
              this.viewDefinition.paginationOptions.defaultPageOptions?.(this),
          })
        )
      } else {
        this.viewDefinition.paginationOptions.limitOptions.handleViewAllButtonClick?.(
          this
        )
      }
    },

    async loadMore() {
      // if there are no more items, do nothing
      if (this.records.length >= this.totalRecords) return

      // save snapshot of currentReloadGeneration
      const currentReloadGeneration = this.reloadGeneration

      this.loading.loadMore = true
      try {
        const results = await this.fetchData()

        // if reloadGeneration is behind the latest one, do not load the results into this.records, as the loadData request has been superseded
        if (currentReloadGeneration < this.reloadGeneration) return

        this.records.push(...results.edges.map((ele) => ele.node))

        this.totalRecords = results.paginatorInfo.total
        this.endCursor = results.paginatorInfo.endCursor
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadMore = false
    },

    // reloads the expandedItem and merges the fields back into the record
    async handleReloadParentItem() {
      if (!this.expandedItem) return

      const record = await this.fetchData(this.expandedItem.id)

      Object.assign(this.expandedItem, record)
    },

    // reloads a specific record in the pageData, if it is present
    async reloadRecord(id) {
      const matchingResult = this.records.find((result) => result.id === id)

      if (!matchingResult) return

      const record = await this.fetchData(id)

      Object.assign(matchingResult, record)
    },
    // if itemId is specific, it will fetch only that specific ID
    async fetchData(itemId = null) {
      const fields = this.viewDefinition.paginationOptions.headerOptions
        .map((headerInfo) => headerInfo.field)
        .concat(this.viewDefinition.requiredFields ?? [])
        .concat(this.viewDefinition.paginationOptions.requiredFields ?? [])

      const { query } = await processQuery(
        this,
        this.viewDefinition,
        fields,
        true
      )

      if (itemId) {
        const result = await executeApiRequest({
          [`get${this.capitalizedType}`]: {
            ...query,
            __args: {
              id: itemId,
            },
          },
        })

        return result
      } else {
        const results = await getPaginatorData(
          this,
          'get' + this.capitalizedType + 'Paginator',
          query,
          this.generatePaginatorArgs(true)
        )

        return results
      }
    },

    async loadInitialData(showLoader = true, currentReloadGeneration) {
      this.endCursor = null
      this.loading.syncData = true
      if (showLoader) this.loading.loadData = true
      try {
        const results = await this.fetchData()

        // if reloadGeneration is behind the latest one, do not load the results into this.records, as the loadData request has been superseded
        if (currentReloadGeneration < this.reloadGeneration) return

        this.records = results.edges.map((ele) => ele.node)

        this.totalRecords = results.paginatorInfo.total
        this.endCursor = results.paginatorInfo.endCursor
      } catch (err) {
        handleError(this, err)
      }
      this.loading.syncData = false
      if (showLoader) this.loading.loadData = false
    },

    // syncs the pageOptions
    async syncPageOptions(syncFilters = false) {
      // sync the search
      this.searchInput = this.search || ''

      // sync the sort
      const sort = this.pageOptions?.sort
      this.currentSortObject =
        this.sortOptions.find((sortObject) => sortObject.key === sort) ?? null

      // sync the filters
      if (syncFilters) {
        if (this.rawFilters.length > 0) {
          const inputFieldsSet = new Set(this.filterInputsArray)
          await Promise.all(
            this.rawFilters.map(async (rawFilterObject) => {
              const matchingFilterObject = this.filterInputsArray.find(
                (crudFilterObject) =>
                  crudFilterObject.filterObject.field ===
                    rawFilterObject.field &&
                  crudFilterObject.filterObject.operator ===
                    rawFilterObject.operator
              )

              if (matchingFilterObject) {
                matchingFilterObject.inputObject.value =
                  rawFilterObject.value === '__undefined'
                    ? null
                    : rawFilterObject.value

                // populate inputObjects if we need to translate any IDs to objects. Do NOT populate the options
                await populateInputObject(this, {
                  inputObject: matchingFilterObject.inputObject,
                  loadOptions: false,
                  selectedItem: this.parentItem,
                })

                // remove from set
                inputFieldsSet.delete(matchingFilterObject)
              }
            })
          )

          // clears any input fields with no matching filterObject
          inputFieldsSet.forEach((ele) => (ele.inputObject.value = null))
        }

        this.filterChanged = false
      }

      // sync the distance filters
      const distancePageOptions = this.pageOptions?.distance

      if (distancePageOptions) {
        // sync the pageOptions distance filters to existing filters
        this.distanceFilterOptions.forEach((distanceFilterObject) => {
          // was this filter set in the pageOptions?
          const matchingRawFilterObject = distancePageOptions.find(
            (rawFilterObject) =>
              rawFilterObject.key === distanceFilterObject.definition.key &&
              rawFilterObject.operator ===
                distanceFilterObject.definition.operator
          )

          // if there is a match, sync it with the distanceFilterObject
          if (matchingRawFilterObject) {
            distanceFilterObject.latitudeValue =
              matchingRawFilterObject.latitude
            distanceFilterObject.longitudeValue =
              matchingRawFilterObject.longitude
            distanceFilterObject.ltValue = matchingRawFilterObject.lt

            distanceFilterObject.gtValue = matchingRawFilterObject.gt
          }
        })
      }
    },

    handleListChange() {
      // also need to emit to parent (if any)
      this.$emit('record-changed')
      this.reset()
    },

    async reset({
      initFilters = false,
      // resetFilters = false,
      // resetSort = false,
      // resetCursor = false,
      resetExpanded = false,
      // reloadData = true,
      // resetPolling = true,
      showLoader = true,
      clearRecords = true,
      syncGridOptions = false,
      resetChanged = false,
    } = {}) {
      // if reset was already called on this tick, stop execution
      if (this.resetCalledOnTick) return

      // indicate that reset was called on this tick
      this.resetCalledOnTick = true

      // reset the indicator next tick
      this.$nextTick(() => {
        this.resetCalledOnTick = false
      })

      if (clearRecords) {
        this.records = []
        this.totalRecords = null
      }

      if (resetExpanded) {
        this.closeExpandedItems()
      }

      if (resetChanged) {
        this.isChanged = true
      }

      let pageOptionsUpdated = false

      if (initFilters) {
        // initialize filter inputs
        this.filterInputsArray = await Promise.all(
          this.viewDefinition.paginationOptions.filterOptions.map(
            async (filterObject) => {
              // sync the filters
              const filters = this.pageOptions?.filters
              let matchingRawFilterObject
              // was this filter set in the pageOptions?
              if (filters) {
                matchingRawFilterObject = filters.find(
                  (rawFilterObject) =>
                    rawFilterObject.field === filterObject.field &&
                    rawFilterObject.operator === filterObject.operator
                )
              }

              const inputObject = {
                fieldKey: filterObject.field,
                primaryField: filterObject.field,
                viewDefinition: this.viewDefinition,
                label:
                  filterObject.text ??
                  camelCaseToCapitalizedString(filterObject.field),
                closeable: false,
                inputOptions: filterObject.inputOptions,
                value: matchingRawFilterObject
                  ? matchingRawFilterObject.value
                  : null,
                inputValue: null,
                options: [],
                readonly: false,
                loading: false,
                focused: false,
                cols: filterObject.cols,
                generation: 0,
                parentInput: null,
                nestedInputsArray: [],
                inputData: null,
              }

              // populate inputObjects if we need to translate any IDs to objects, and also populate any options
              await populateInputObject(this, {
                inputObject,
                selectedItem: this.parentItem,
              })

              return {
                filterObject,
                inputObject,
              }
            }
          )
        )

        // initialize distanceFilterOptions, if any
        this.distanceFilterOptions = []
        if (this.viewDefinition.paginationOptions.distanceFilterOptions) {
          for (const distanceFilterObject of this.viewDefinition
            .paginationOptions.distanceFilterOptions) {
            this.distanceFilterOptions.push({
              definition: distanceFilterObject,
              latitudeValue: null,
              longitudeValue: null,
              gtValue: null,
              ltValue: null,
            })
          }
        }

        // if pageOptions is undefined, use the defaultPageOptions fn if any
        if (
          this.pageOptions === undefined &&
          this.viewDefinition.paginationOptions.defaultPageOptions
        ) {
          this.$emit(
            'pageOptions-updated',
            this.viewDefinition.paginationOptions.defaultPageOptions(this)
          )

          pageOptionsUpdated = true
        }

        this.syncPageOptions(false)
      } else {
        this.syncPageOptions(true)
      }

      // sync the grid options
      if (syncGridOptions) {
        if (this.viewDefinition.paginationOptions.overrideViewMode) {
          // if overrideViewMode is set on the viewDefinition, use that
          this.isGrid =
            this.viewDefinition.paginationOptions.overrideViewMode === 'grid'
        } else {
          this.isGrid = !!defaultGridView
        }
      }

      // if the pageOptions have been updated, don't load the data, as the pageOptions-updated event will trigger the update after this (with the updated page options)
      if (!pageOptionsUpdated) {
        this.reloadGeneration++

        this.loadInitialData(showLoader, this.reloadGeneration)
      }
    },
  },
}
