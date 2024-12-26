import { FilterByField } from '../../schema'
import { EntityDefinition } from './entity'

export type InputOptions = {} & {
  inputType: InputType

  getOptions?: (that, item) => Promise<any[]>
  getInitialValue?: (that) => unknown

  // submitting to API, in filterBy and create/update functions
  parseValue?: (val: any) => any

  hint?: string
  inputRules?: any[]
  // is the field nullable? if so, we will add some text saying that to the input
  optional?: boolean

  // should the "clear" X button be visible?
  clearable?: boolean

  // for type-autocomplete, whether or not to load results from the server if getOptions is provided
  loadServerResults?: boolean

  // for type-autocomplete, type-combobox, multiple-select -- a way to fully customize the chip appearance. will override the hasAvatar
  selectionComponent?: any
  // for avatar
  // fallbackIcon?: string
  // the nested type for this input if it is value-array
  // nestedInputType?: InputType
  // nestedKeyText?: string
  // nestedValueText?: string
  // typename?: string

  // for type-autocomplete, type-combobox, multiple-select -- contains the avatar
  entity?: EntityDefinition

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

  // for text-autocomplete and text-combobox, function that returns an array of suggestions (to override the default loadTypeSearchResults fetcher)
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
  nestedOptions?: NestedOptions
}

export type NestedOptions = {
  entryName?: string
  pluralEntryName?: string
  fields: {
    key: string
    text?: string
    inputOptions?: InputOptions
    cols?: number
  }[]
}

export type SortObject = {
  text?: string
  field: string
  key: string
  desc: boolean
  additionalSortObjects?: {
    field: string
    desc: boolean
  }[]
}

export type FilterObject = {
  text?: string
  field: string
  operator: keyof FilterByField<any>
  inputOptions?: InputOptions
  cols?: number
  preset?: boolean // should this filter show up as a preset
  // should this filter show up in the special chip filters section? (only certain types supported)
  chipOptions?: {
    component?: any // a custom component for the chips, if any
  }
}

export type HeaderObject = {
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
  | 'checkbox'
  | 'stripe-cc'
  | 'stripe-pi'
  | 'stripe-pi-editable'
  | 'textarea'
  | 'type-combobox' // type-combobox allows the user to add new type inputs on the fly. if getOptions is provided, it will not fetch from server and instead just use the getOptions results
  | 'type-autocomplete' // type-autocomplete allows user to type in stuff and get suggestions from the server. if getOptions is provided, those will be the initial search results only
  | 'type-autocomplete-multiple' // same as type-autocomplete but allows for multiple inputs
  | 'select' // standard select -- works with text or types
  | 'multiple-select' // multiple select -- works with text or types
  | 'text-autocomplete' // validate text input using server-side calls
  | 'text-combobox' // validate text input using server-side calls, but selection not required
  | 'rating' // rating from 1 to 5
  | 'text'

export type InputFieldDefinition = {
  text?: string
  // special options pertaining to the specific inputType
  inputOptions?: InputOptions
  // if not provided, will default to a text field
} & {}

export type RenderFieldDefinition = {
  // label
  text?: string
  // which fields are required -- if none, assumes [x] *is* the only field
  fields?: string[]

  // path leading up to the field. i.e. item.blah
  pathPrefix?: string

  // adds __args fields to the requesting query as necessary
  args?: {
    getArgs: (that) => any
    path: string // for example, if args at abc.xyz.__args, use "abc.xyz"
  }[]

  // if provided, only load this field if this returns true
  loadIf?: (that) => boolean
} & {
  // options related to rendering, which will be passed to custom component
  renderOptions?: RenderOptions

  component?: any // component for rendering the field in table
}

export type RenderOptions = {
  [x: string]: any
}

export type EditFieldDefinition = {
  field: string
  cols?: number
  handleFileAdded?: (that, inputsArray, inputObject, fileRecord) => void
  hideIf?: (that, inputsArray) => boolean
  watch?: (that, val, prev) => void
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
  parseValue?: (val: any) => unknown
}

export type ExportFieldDefinition = {
  // the fieldpath that should be exported
  field: string

  // should the field be excluded if this returns true
  hideIf?: (that) => boolean

  args?: {
    getArgs: (that) => any
    path: string
  }[]
}

export type PriceObject = {
  price: number // 100
  quantity?: number // 2
  discount?: number // 5
  discountPercent?: number // 5
}
