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
    getArgs: (that) => any
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
    // custom function that will return the lookup params, if any
    getLookupParams?: (that) => any
  }

  // options related to viewing multiple, if possible
  paginationOptions?: {
    // function that runs when pagination interface is opened for the first time
    onSuccess?: (that) => void

    // does the interface have the ability to search?
    searchOptions?: `${T}Paginator` extends keyof InputTypes
      ? 'search' extends keyof InputTypes[`${T}Paginator`]
        ? {
            // should the search bar show up in the presets
            preset?: boolean
            // function that will return the params to be passed with the search, if any
            getParams?: (that, searchQuery) => any
          }
        : null
      : null

    defaultPageOptions?: (that: any) => CrudPageOptions

    defaultLockedFilters?: (that: any) => CrudRawFilterObject[]

    // all of the possible usable filters
    filterOptions: `${T}FilterByObject` extends keyof InputTypes
      ? FilterObject[]
      : []

    sortOptions: SortObject[]

    // should a hero image be displayed? only applies to grid view
    heroOptions?: {
      // function that will get the preview image from the item
      getPreviewImage?: (item: any) => any

      // function that will get the preview name from the item
      getPreviewName?: (item: any) => any

      // custom component that should be rendered, which will override the above 2 options
      component?: any
    }

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

    // custom component
    component?: any
    // can the results be downloaded?
    downloadOptions?: {
      // custom fields to download
      fields: ExportFieldDefinition[]
    }
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

    // will the button be hidden on the interface?
    hidden?: boolean
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
    // replacement icon
    icon?: string
    // replacement text
    text?: string
    // function that runs when recorded is successfully edited
    onSuccess?: (that, item) => void

    // post-processing of inputs, if any
    afterLoaded?: (that, inputsArray) => Promise<void>
  }

  deleteOptions?: {
    // no fields when deleting
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string
    // function that runs when recorded is successfully deleted
    onSuccess?: (that, item) => void
  }

  viewOptions?: {
    // required: fields that can be viewed
    fields: (string | ViewFieldDefinition)[]
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

      // custom component that should be rendered, which will override the above 2 options
      component?: any
    }
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

      // custom component that should be rendered, which will override the above 2 options
      component?: any
    }
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
  }

  enterOptions?: {
    routeType: 'i' | 'a' | 'my' | 's'
  }

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

  // params that should be applied when looking up results (server-X input type) -- namely filterBy, sortBy
  lookupParams?: (that, inputObjectArray) => any

  // params that should be passed along with the search query (i.e. search.params)
  searchParams?: (that, inputObjectArray) => any

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
  | 'single-image'
  | 'multiple-image'
  | 'multiple-media'
  | 'multiple-file'
  | 'value-array'
  | 'avatar'
  | 'datepicker'
  | 'datetimepicker'
  | 'switch'
  | 'textarea'
  | 'combobox' // combobox allows the user to add new inputs on the fly (will change to autocomplete in filter interfaces)
  | 'server-combobox' // server-combobox allows the user to add new inputs on the fly with getOptions optional, and fetching results from server (will change to autocomplete in filter interfaces)
  | 'autocomplete' // same as combobox but cannot add new inputs
  | 'autocomplete-multiple' // same as combobox but cannot add new inputs
  | 'server-autocomplete' // if there's lots of entries, may not want to fetch all of the entries at once. getOptions will be optional
  | 'select' // standard select
  | 'multiple-select' // multiple select
  | 'text'

export type ActionOptions = {
  // if there is a singular giraffeql operation to execute
  operationName?: string

  // if there is a custom function to execute when submitted
  onSubmit?: (that, item, args) => void

  title: string
  icon: string
  // custom component, if any
  component?: any
  // function that runs when action is successfully completed
  onSuccess?: (that, item) => void
  inputs: {
    field: string
    definition: {
      text: string
      inputType?: InputType
      hint?: string
      getOptions?: (that) => Promise<any[]>
      // special options pertaining to the specific inputType
      inputOptions?: InputOptions
      optional?: boolean
      inputRules?: any[]
      default?: (that) => unknown
    }
    hideIf?: (that, inputsArray) => boolean
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
  // not currently implemented
  // hideIf?: (that, inputsArray) => boolean
}

export type ViewFieldDefinition = {
  field: string
  hideIf?: (that, fieldValue, item, inputsArray) => boolean
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
