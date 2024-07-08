import { InputTypes, MainTypes, FilterByField } from '../../schema'
import { CrudPageOptions, CrudRawFilterObject, CrudRawSortObject } from './misc'

export type FieldDefinition = {
  // the fields involved in this field
  fields?: string[]
  // path leading up to the field. i.e. item.blah
  pathPrefix?: string

  text?: string
  // hint field for helping the user to fill out the field
  hint?: string

  inputType?: InputType

  // special options pertaining to the specific inputType
  inputOptions?: InputOptions

  // options for how this component will be rendered in the viewRecordTableInterface
  tableOptions?: {
    verticalView?: boolean
    hideIf?: (fieldValue, item) => boolean
  }

  // special options that will be passed to the column component
  columnOptions?: {
    [x: string]: any
  }

  args?: {
    getArgs: (that) => Promise<any>
    path: string
    // if provided, only load this field if this returns true
    loadIf?: (that) => boolean
  }

  inputRules?: any[]
  getOptions?: (that) => Promise<any[]>

  // is the field hidden? if yes, won't fetch it for edit fields
  hidden?: boolean
  // is the field nullable? if so, we will add some text saying that to the input
  optional?: boolean
  default?: (that) => unknown
  // fetching from API, in editRecordInterface (when editing/viewing)
  serialize?: (val: any) => any
  // submitting to API, in filterBy and create/update functions
  parseValue?: (val: any) => any
  // for crudRecordPage. parsing the query params
  parseQueryValue?: (val: any) => unknown

  component?: any // component for rendering the field in table
}

export type SimpleRecordInfo<T extends keyof MainTypes> = Partial<RecordInfo<T>>

export type RecordInfo<T extends keyof MainTypes> = {
  // optional title for this recordInfo
  title?: string
  // name of the type
  typename: T
  pluralTypename: string
  name: string
  pluralName: string
  icon?: string
  routeType: string
  hasName?: boolean
  hasAvatar?: boolean
  hasDescription?: boolean
  hasOrganizationOwner?: boolean
  hasUserOwner?: boolean

  // how to render the item as a string. by default, it is usually rendered as name || id
  renderItem?: (item) => string

  // model name for "following" this type
  followLinkModel?: string

  // fields that must always be requested when fetching the specific item and multiple items, along with the id field. could be for certain rendering purposes
  requiredFields?: string[]

  // all of the "known" fields of the type. could be nested types (not included in type hints)
  fields?: {
    [K in string]?: FieldDefinition
  }

  // options related to viewing a single record (via viewRecordPage), if any
  pageOptions?: {
    // required fields for the page, if any
    fields?: string[]

    // custom function that will return the lookup params, if any
    getLookupParams?: (that) => any

    // whether or not to render the record as a full page (12 cols), rather than centered with an offset
    fullPageMode?: boolean

    // the expand types to automatically render below (as previews)
    // string corresponds to the key
    previewExpandTypes?: string[]

    // custom page component
    component?: any

    // should the actions be hidden?
    hideActions?: boolean
    // should the refresh button be hidden?
    hideRefresh?: boolean
    // should the minimize button be hidden?
    hideMinimize?: boolean
  }

  // options related to viewing multiple, if possible
  paginationOptions?: {
    // function that runs when pagination interface is opened for the first time
    onSuccess?: (that) => void

    // does the interface have the ability to search?
    searchOptions?: `${T}PaginatorInput` extends keyof InputTypes
      ? 'search' extends keyof InputTypes[`${T}PaginatorInput`]
        ? {
            // should the search bar show up in the presets
            preset?: boolean
            // function that will return the params to be passed with the search, if any
            getParams?: (that, searchQuery) => any
          }
        : null
      : null

    defaultPageOptions?: (
      that: any
    ) => Promise<CrudPageOptions> | CrudPageOptions

    defaultLockedFilters?: (that: any) => CrudRawFilterObject[]

    // all of the possible usable filters
    filterOptions: `${T}FilterByObject` extends keyof InputTypes
      ? FilterObject[]
      : []

    distanceFilterOptions?: {
      key: string
      text: string
      defaultLocation?: (that) => Promise<any>
      defaultValue?: (that) => Promise<any>
    }[]

    sortOptions: SortObject[]

    // fields required but not shown, such as fields needed for heroOptions
    requiredFields?: string[]

    // should a hero image be displayed? only applies to grid view
    heroOptions?: {
      // function that will get the preview image from the item
      getPreviewImage?: (item: any) => any

      // function that will get the preview name from the item
      getPreviewName?: (item: any) => any

      // should the v-img component be contained?
      containMode?: boolean

      // custom component that should be rendered, which will override the above 2 options
      component?: any
    }

    // should the entire toolbar be hidden? this will override some of the toolbar-related options below
    hideToolbar?: boolean

    // should the actions be hidden?
    hideActions?: boolean

    // should the refresh button be hidden?
    hideRefresh?: boolean

    // extra sort params that are to be appended to the user-selected sort params
    additionalSortParams?: CrudRawSortObject[]

    // the headers of the table
    headerOptions: HeaderObject[]

    // header fields that should be hidden
    excludeHeaders?: string[]

    // special options for overriding the action header element
    headerActionOptions?: {
      text?: string
      width?: string
    }
    handleRowClick?: (that, props) => void
    handleGridElementClick?: (that, item) => void

    // options relating to the grid interface
    gridOptions?: {
      justify?: 'center' | 'left'
      colsObject?: {
        // cols, out of 12
        xs?: number
        sm?: number
        md?: number
        lg?: number
      }
    }

    // custom component
    component?: any
    // can the results be downloaded?
    downloadOptions?: {
      // custom fields to download
      fields: ExportFieldDefinition[]
    }

    // this option, if defined, will override the default grid/list option set by the user
    overrideViewMode?: 'grid' | 'list'

    // should the grid/list toggle button be hidden?
    hideGridModeToggle?: boolean

    // should the sortBy feature be hidden?
    hideSortOptions?: boolean

    // override the number of records per page
    resultsPerPage?: number

    // number of records to show initially
    maxInitialRecords?: number

    limitOptions?: {
      // what should clicking the view all button do? (if undefined, button will be left out)
      handleViewAllButtonClick?: (that) => void
    }

    // hide the view more button
    hideViewMoreOptions?: {
      // even though the view more button is hidden, should more records be allowed to load? infinite scroll must be true on paginatorOptions too.
      infiniteScroll?: boolean
    }

    // should more records be loaded when the scroll bar reaches the bottom?
    infiniteScroll?: boolean

    // hide the total number of results (showing X of Y)
    hideCount?: boolean

    // hide the title
    hideTitle?: boolean

    // show button to "view all" of this record
    showViewAll?: boolean

    // the min height of the pagination container, if any
    minHeight?: string

    // loader will be linear by default
    loaderStyle?: 'circular' | 'linear'
  }

  dialogOptions?: {
    // should the actions be hidden?
    hideActions?: boolean
    // should the refresh button be hidden?
    hideRefresh?: boolean
    // should the title and icon be hidden?
    hideTitle?: boolean
  }

  addOptions?: {
    // required: fields that can be added
    fields: (string | EditFieldDefinition)[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string

    // custom function to modify the inputs in-place before they get sent as args
    inputsModifier?: (that, inputs) => void

    // custom action when the "new" button is clicked, if any. item refers to parentItem, if any
    customAction?: (that, parentItem) => void

    // function that runs when record is successfully added
    onSuccess?: (that, item) => void

    // post-processing of inputs, if any
    afterLoaded?: (that, inputsArray) => Promise<void>

    // under what conditions will the button be hidden?
    hideIf?: (that) => boolean

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string
  }

  importOptions?: {
    // required: fields that can be added
    fields: ImportFieldDefinition[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string

    // custom function to modify the inputs in-place before they get sent as args
    inputsModifier?: (that, inputs) => void

    // skip the import row if this is true
    skipIf?: (that, inputs) => boolean

    // function that runs when import is successfully run on at least one record
    onSuccess?: (that) => void

    // function that runs when an import operation throws an error. it is a way to ignore (catch) the error if it should be caught
    onError?: (that, err) => void

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string
  }

  editOptions?: {
    // required: fields that can be added
    fields: (string | EditFieldDefinition)[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string

    // custom function to modify the inputs in-place before they get sent as args
    inputsModifier?: (that, inputs) => void

    // function that runs when recorded is successfully edited
    onSuccess?: (that, item) => void

    // post-processing of inputs, if any
    afterLoaded?: (that, inputsArray) => Promise<void>

    // under what conditions will the button be hidden?
    hideIf?: (that, item) => boolean

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string
  }

  deleteOptions?: {
    // no fields when deleting
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string
    // function that runs when recorded is successfully deleted
    onSuccess?: (that, item) => void

    // under what conditions will the button be hidden?
    hideIf?: (that, item) => boolean

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string
  }

  viewOptions?: {
    // required: fields that can be viewed
    fields: (string | ViewFieldDefinition)[]

    // additional fields required (but not shown)
    requiredFields?: string[]

    // custom component
    component?: any

    // function that runs when recorded is successfully viewed
    onSuccess?: (that, item) => void

    // should the viewOptions interface show a hero image/text at the top
    heroOptions?: {
      // function that will get the preview image from the item
      getPreviewImage?: (item: any) => any

      // function that will get the preview name from the item
      getPreviewName?: (item: any) => any

      // should the v-img component be contained?
      containMode?: boolean

      // custom component that should be rendered, which will override the above 2 options
      component?: any
    }

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string
  }

  previewOptions?: {
    // required: fields that can be previewed
    fields: string[]

    // should the previewOptions interface show a hero image/text at the top
    heroOptions?: {
      // function that will get the preview image from the item
      getPreviewImage?: (item: any) => any

      // function that will get the preview name from the item
      getPreviewName?: (item: any) => any

      // should the v-img component be contained?
      containMode?: boolean

      // custom component that should be rendered, which will override the above 2 options
      component?: any
    }

    // hides the "view" button
    hideViewButton?: boolean

    // hides the follow button, if any
    hideFollowButton?: boolean

    // customActions
    customActions?: {
      text: string
      icon: string
      handleClick: (that, item: any) => void
    }[]
  }

  chipOptions?: {
    fields: string[]
    // the function to derive the name on the chip. else defaults to name
    getName?: (item: any) => any
    // the function to derive the image on the chip. else defaults to avatar
    getImage?: (item: any) => any
  }

  postOptions?: {
    recordInfo: RecordInfo<any>

    // are the posts readonly?
    readonly?: boolean

    // custom component
    component?: any

    // fields to hide
    hiddenFields?: string[]

    // initial sort options that should be applied to nested component
    initialSortOptions?: CrudRawSortObject

    // custom function for generating the lockedFilters for filtering the posts, if any
    getLockedFilters?: (that, selectedItem) => any
  }

  copyOptions?: {
    // required: fields that should be copied
    fields: string[]
    // custom component
    component?: any

    // replacement icon
    icon?: string
    // replacement text
    text?: string
  }

  shareOptions?: {
    // custom component
    component?: any

    // get a custom share URL
    getUrl?: (that, recordInfo, id) => string

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string
  }

  enterOptions?: {}

  expandTypes: {
    // the key that will be associated with this in the URL
    key: string
    // recordInfo is required unless it is a custom component
    recordInfo?: RecordInfo<any>
    component?: any
    // name for the expandType, otherwise recordInfo.name will be used
    name?: string
    // icon for the expandType, otherwise recordInfo.icon will be used
    icon?: string
    // function that will replace the lockedSubFilters() computed property in crud.js if provided
    lockedFilters?: (that, item) => CrudRawFilterObject[]
    // headers fields that should not be shown
    excludeHeaders?: string[]
    // filter fields that should not be shown (however, they can still be manipulated in a custom component file)
    excludeFilters?: string[]
    // initial filters that should be loaded into the nested component
    initialFilters?: CrudRawFilterObject[]

    // initial sort options that should be applied to nested component
    initialSortOptions?: CrudRawSortObject

    // force use of dialog for this expandType. default false.
    forceDialog?: boolean

    // show any preset filters that may be on the recordInfo (default no)
    showPresets?: boolean

    // number of results to show per page for this expand option. else, defaults to 12
    resultsPerPage?: number

    // open the expand in the same interface instead of expanding or opening a dialog, and related options
    breadcrumbOptions?: {
      hideBreadcrumbs?: boolean
    }

    // show this option as its own block/row if it is rendered as a grid
    showRowIfGrid?: boolean

    // hide the expand type if true
    hideIf?: (that, item) => boolean
  }[]

  customActions?: {
    text: string
    icon: string
    showIf?: (that, item) => boolean

    // if this is specified, it will open a dialog that will allow the user to complete the action (with inputs, if necessary)
    actionOptions?: ActionOptions

    // if this above is not specified, this must be specified
    simpleActionOptions?: {
      handleClick: (that, item) => void
      isAsync?: boolean // should the button have a loader and not be clickable while the operation is processing?
      // should a confirmation dialog trigger when clicking this action
      confirmOptions?: {
        text?: string
      }
    }
  }[]
}

type InputOptions = {
  // for server-autocomplete and server-combobox, multiple-select -- a simple way to get an avatar/name chip.
  hasAvatar?: boolean

  // for server-autocomplete, server-combobox, multiple-select -- a way to fully customize the chip appearance. will override the hasAvatar
  selectionComponent?: any
  // for avatar
  // fallbackIcon?: string
  // the nested type for this input if it is value-array
  // nestedInputType?: InputType
  // nestedKeyText?: string
  // nestedValueText?: string
  typename?: string
  cols?: number // defaults to 12

  // for stripe-pi
  paymentOptions?: {
    quantityOptions?: {
      default?: () => number
      getDiscountScheme?: (that, item) => any
    }
    getPriceObject: (
      that,
      item,
      quantity: number,
      discountScheme?
    ) => PriceObject
    // for stripe-pi and stripe-pi-editable input types, function that returns the instanceOptions (in the genericInput)
    getPaymentIntent: (that, inputObject, selectedItem, quantity, amount) => any

    // for stripe-pi, if there is a paypal option
    paypalOptions?: {
      createPaypalOrder: (
        that,
        inputObject,
        selectedItem,
        quantity,
        amount
      ) => any

      capturePaypalOrder: (orderId) => any
    }
  }

  // for single-file-url and avatar, use the firebase URL instead of the cdn url?
  useFirebaseUrl?: boolean

  // for single-file-url, multiple-file, restrict the content type
  contentType?: string

  // for text input field, additional params that should be binded, like 'type'. should be an object, like { type: 'number' }
  inputParams?: any

  // params that should be applied when looking up results (server-X input type) -- namely filterBy, sortBy
  lookupParams?: (that, inputObjectArray) => any

  // params that should be passed along with the search query (i.e. search.params)
  searchParams?: (that, inputObjectArray) => any

  // additional args that should be appended to the __args when creating a new record for a combobox
  getCreateArgs?: (that, inputObjectArray) => any

  // for text-autocomplete and text-combobox, function that returns an array of suggestions
  getSuggestions?: (that, inputObject) => Promise<string[]>

  // for multiple-file input, maximum number of files
  limit?: number
  // for multiple-file input, whether or not to use mediaMode
  mediaMode?: boolean

  // for single-image-url
  avatarOptions?: {
    // the fallback icon for the avatar
    fallbackIcon?: string
  }

  // only applies to value-array
  nestedFields?: {
    key: string
    inputType: InputType
    text?: string
    inputOptions?: InputOptions
    optional?: boolean
    hint?: string
    inputRules?: any[]
    getOptions?: (that) => Promise<any[]>
  }[]
}

type SortObject = {
  text?: string
  field: string
  desc: boolean
}

export type FilterObject = {
  text?: string
  field: string
  operator: keyof FilterByField<any>
  inputType?: InputType
  preset?: boolean // should this filter show up as a preset
  chips?: boolean // should this filter show up in the special chip filters section? (only certain types supported)
}

type HeaderObject = {
  field: string
  width?: string
  sortable?: boolean
  align?: string
  hideUnder?: 'sm' | 'md' | 'lg' | 'xl' // hide this column if viewport is smaller than this
  hideIfDialog?: boolean // hide this column if shown in a dialog element
  hideIfGrid?: boolean // hide this column if in grid mode
  hideIfList?: boolean // hide this column if in list mode
  hideIf?: (that) => boolean
  hideTitleIfGrid?: boolean // hide the header if in a grid
}

export type InputType =
  | 'html'
  | 'single-image-url'
  | 'multiple-image'
  | 'multiple-file'
  | 'single-file-url'
  | 'value-array'
  | 'datepicker'
  | 'datetimepicker'
  | 'switch'
  | 'stripe-cc'
  | 'stripe-pi'
  | 'stripe-pi-editable'
  | 'textarea'
  | 'combobox' // combobox allows the user to add new inputs on the fly (will change to autocomplete in filter interfaces)
  | 'server-combobox' // server-combobox allows the user to add new inputs on the fly with getOptions optional, and fetching results from server (will change to autocomplete in filter interfaces)
  | 'autocomplete' // same as combobox but cannot add new inputs
  | 'autocomplete-multiple' // same as combobox but cannot add new inputs
  | 'server-autocomplete' // if there's lots of entries, may not want to fetch all of the entries at once. getOptions will be optional
  | 'select' // standard select
  | 'multiple-select' // multiple select
  | 'text-autocomplete' // validate text input using server-side calls
  | 'text-combobox' // validate text input using server-side calls, but selection not required
  | 'rating' // rating from 1 to 5
  | 'text'

export type ActionOptions = {
  // if there is a singular giraffeql operation to execute
  operationName?: string

  // if there is a custom function to execute when submitted
  onSubmit?: (that, item, args) => void

  title: string
  icon: string

  // override submit button text
  submitButtonText?: string

  // hide the actions bar entirely (since stripe-pi has its own button)
  hideActions?: boolean

  // custom component, if any
  component?: any

  // the query to return with the action, if any
  getReturnQuery?: (that, item) => any

  // function that runs when action is successfully completed
  onSuccess?: (that, item) => void
  inputs: {
    field: string
    definition: {
      text?: string
      inputType?: InputType
      hint?: string
      getOptions?: (that) => Promise<any[]>
      // special options pertaining to the specific inputType
      inputOptions?: InputOptions
      optional?: boolean
      inputRules?: any[]
      default?: (that) => unknown
    }

    watch?: (that, val, prev) => void

    // number of cols the input should take. defaults to 12
    cols?: number

    // do not render the input, but otherwise load it
    hideIf?: (that, item, inputsArray) => boolean

    // exclude the input entirely at initialization based on the snapshot
    excludeIf?: (that, item, selectedItem) => boolean
  }[]

  // function that will use the selectedItem (if any) to modify the args fed into the operation
  argsModifier?: (that, item, args) => void
  // modifier function that will use the original item to assemble the selectedItem (for pre-populating fields in the executeActionInterface)
  selectedItemModifier?: (that, item) => any
}

export type EditFieldDefinition = {
  field: string
  cols?: number
  handleFileAdded?: (that, inputsArray, inputObject, fileRecord) => void
  hideIf?: (that, inputsArray) => boolean
}

export type ViewFieldDefinition = {
  field: string
  hideIf?: (that, fieldValue, item, inputsArray) => boolean

  // whether or not to show the key:val combo vertically
  verticalMode?: boolean
}

export type ImportFieldDefinition = {
  // the corresponding field, for use with selectedItem binding
  field: string

  // the fieldpath that should be imported, in dot notation
  path?: string

  // for parsing CSV imports
  parseValue?: (val: unknown) => unknown
}

export type ExportFieldDefinition = {
  // the fieldpath that should be exported
  field: string

  // should the field be excluded if this returns true
  hideIf?: (that) => boolean

  args?: {
    getArgs: (that) => any
    path: string
    // if provided, only load this field if this returns true
    loadIf?: (that) => boolean
  }
}

export type PriceObject = {
  price: number // 100
  quantity?: number // 2
  discount?: number // 5
  discountPercent?: number // 5
}
