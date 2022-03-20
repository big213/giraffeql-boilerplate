import { InputTypes, MainTypes, FilterByField } from '../../schema'
import { CrudRawFilterObject, CrudRawSortObject } from './misc'

export type RecordInfo<T extends keyof MainTypes> = {
  // optional title for this recordInfo
  title?: string
  // name of the type
  typename: T
  pluralTypename: string
  name: string
  pluralName: string
  icon?: string
  // how to render the item as a string
  renderItem?: (item) => string

  // fields that must always be requested when fetching the specific item and multiple items, along with the id field. could be for certain rendering purposes
  requiredFields?: string[]

  // all of the "known" fields of the type. could be nested types (not included in type hints)
  fields?: {
    [K in string]?: {
      // the fields involved in this field
      fields?: string[]
      // path leading up to the field. i.e. item.blah
      pathPrefix?: string

      text?: string
      // hint field for helping the user to fill out the field
      hint?: string
      icon?: string

      inputType?: InputType

      // special options pertaining to the specific inputType
      inputOptions?: InputOptions

      // special options that will be passed to the column component
      columnOptions?: {
        [x: string]: any
      }

      args?: {
        getArgs: (that) => any
        path: string
      }

      inputRules?: any[]
      getOptions?: (that) => Promise<any[]>

      // filters that should be applied when looking up results (server-X input type)
      lookupFilters?: (that, inputObjectArray) => any[]

      // is the field hidden? if yes, won't fetch it for edit fields
      hidden?: boolean
      // is the field nullable? if so, we will add some text saying that to the input
      optional?: boolean
      default?: (that) => unknown
      // fetching from API, in editRecordInterface (when editing/viewing)
      serialize?: (val: unknown) => unknown
      // submitting to API, in filterBy and create/update functions
      parseValue?: (val: unknown) => unknown
      // for crudRecordPage. parsing the query params
      parseQueryValue?: (val: unknown) => unknown
      // for parsing CSV imports
      parseImportValue?: (val: unknown) => unknown
      component?: any // component for rendering the field in table
    }
  }

  // options related to viewing multiple, if possible
  paginationOptions?: {
    // does the interface have a search bar?
    hasSearch: `${T}Paginator` extends keyof InputTypes
      ? 'search' extends keyof InputTypes[`${T}Paginator`]
        ? boolean
        : false
      : false

    // the field to filter by on i-crud path, if any
    publicFilterField?: string

    // all of the possible usable filters
    filterOptions: `${T}FilterByObject` extends keyof InputTypes
      ? FilterObject[]
      : []

    sortOptions: SortObject[]

    // extra sort params that are to be appended to the user-selected sort params
    additionalSortParams?: CrudRawSortObject[]

    // the headers of the table
    headerOptions: HeaderObject[]
    // special options for overriding the action header element
    headerActionOptions?: {
      text?: string
      width?: string
    }
    handleRowClick?: (that, item) => void
    // custom component
    interfaceComponent?: any
    // can the results be downloaded?
    downloadOptions?: {
      // custom fields to download. otherwise, the header fields will be downloaded
      fields?: string[]
    }
  }

  addOptions?: {
    // required: fields that can be added
    fields: string[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string
  }

  importOptions?: {
    // required: fields that can be added
    fields: string[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string
  }

  editOptions?: {
    // required: fields that can be added
    fields: string[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string
    // replacement icon
    icon?: string
    // replacement text
    text?: string
  }

  deleteOptions?: {
    // no fields when deleting
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string
  }

  viewOptions?: {
    // required: fields that can be viewed
    fields: string[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    // currently must use getX
    // operationName?: string
  }

  commentOptions?: {
    recordInfo: RecordInfo<any>
    component: any
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
  }[]

  customActions?: {
    text: string
    icon: string
    showIf?: (that, item) => boolean
    handleClick: (that, item) => void
    isAsync?: boolean // should the button have a loader and not be clickable while the operation is processing?
  }[]
}

type InputOptions = {
  // for server-autocomplete and server-combobox
  hasAvatar?: boolean
  // for avatar
  // fallbackIcon?: string
  // the nested type for this input if it is value-array
  // nestedInputType?: InputType
  // nestedKeyText?: string
  // nestedValueText?: string
  typename?: string
  cols?: number // defaults to 12
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
}

type HeaderObject = {
  field: string
  width?: string
  sortable?: boolean
  align?: string
  hideUnder?: 'sm' | 'md' | 'lg' | 'xl' // hide this column if viewport is smaller than this
  hideIfDialog?: boolean // hide this column if shown in a dialog element
  hideIf?: (that) => boolean
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
  | 'switch'
  | 'textarea'
  | 'combobox' // combobox allows the user to add new inputs on the fly (will change to autocomplete in filter interfaces)
  | 'server-combobox' // server-combobox allows the user to add new inputs on the fly with getOptions optional, and fetching results from server (will change to autocomplete in filter interfaces)
  | 'autocomplete' // same as combobox but cannot add new inputs
  | 'server-autocomplete' // if there's lots of entries, may not want to fetch all of the entries at once. getOptions will be optional
  | 'select' // standard select
  | 'multiple-select' // multiple select
  | 'text'
