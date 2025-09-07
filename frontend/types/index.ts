import { FilterByField } from '../../schema'
import { EntityDefinition } from './entity'

export type InputFieldDefinition = {
  fieldKey: string
  // if inputDefinition is undefined, will attempt lookup using fieldKey (if available)
  inputDefinition?: InputDefinition
  cols?: number
  handleFileAdded?: (that, inputsArray, inputObject, fileRecord) => void
  hideIf?: (that, parentItem, inputsArray) => boolean

  watch?: (that, val, prev) => void
}

export type NestedInputFieldDefinition = {
  // fieldKey is always required, as string lookups not allowed
  inputDefinition: InputDefinition
} & InputFieldDefinition

export type ArrayOptions = {
  entryName?: string
  pluralEntryName?: string
  type: NestedInputFieldDefinition | NestedInputFieldDefinition[] // inputType or an object
}

export type SortFieldDefinition = {
  text?: string
  fieldPath: string
  key: string
  desc: boolean
  additionalSortObjects?: {
    fieldPath: string
    desc: boolean
  }[]
}

export type FilterInputFieldDefinition = InputFieldDefinition & {
  text?: string // if overriding the inputDefinition.text
  operator: keyof FilterByField<any>
  preset?: boolean // should this filter show up as a preset
  // should this filter show up in the special chip filters section? (only certain types supported)
  chipOptions?: {
    component?: any // a custom component for the chips, if any
  }
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
  | 'boolean-select'
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

export type InputDefinition = {} & {
  // if not provided, will default to text field
  inputType?: InputType

  // the label for the field
  text?: string

  getOptions?: (that, parentItem, forceReload?) => Promise<any[]>
  getInitialValue?: (that, parentItem) => unknown

  // submitting to API, in filterBy and create/update functions
  parseValue?: (val: any, inputObjectArray) => any

  // retrieving from API and populating the input field
  serialize?: (val: any, parentItem) => any

  hint?: string
  inputRules?: any[]
  // is the field nullable? if so, we will add some text saying that to the input
  optional?: boolean

  // for type-autocomplete, whether or not to load results from the server if getOptions is provided
  loadServerResults?: boolean

  // for type-autocomplete, type-combobox, multiple-select -- a way to fully customize the chip appearance. will override the hasAvatar
  selectionComponent?: any

  // for multiple-select and select mainly -- a way to customize the appearance of enum-based chips using a simple valuesMap. will take precedence over selectionComponent
  selectionValuesMap?: any

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

    renderPriceSummary?: (that, item, priceObject: PriceObject) => string

    // for stripe-pi and stripe-pi-editable input types, function that returns the instanceOptions (in the genericInput)
    getPaymentIntent: (that, inputObject, parentItem, quantity, amount) => any

    // for stripe-pi, if there is a paypal option
    paypalOptions?: {
      createPaypalOrder: (
        that,
        inputObject,
        parentItem,
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
  arrayOptions?: ArrayOptions
}

export type RenderDefinition = {
  // label
  text?: string
  // which fields are required -- if none, assumes [x] *is* the only field
  fields?: string[]

  // path leading up to the field. i.e. item.blah
  pathPrefix?: string | null

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

  editOptions?: {
    mode?: 'right' | 'left' // how will the edit dialog be activated? if undefined, will default to right

    fieldKeys?: string[] // the fields to be edited, if different from the default fieldKey
  }
}

export type RenderOptions = {
  [x: string]: any
}

export type CreateInputFieldDefinition = InputFieldDefinition & {
  // should this input be hidden if it is locked? -- only applies to create and actions
  hideIfLocked?: boolean

  // exclude the input entirely at initialization based on the snapshot -- only applies to create and actions
  excludeIf?: (that, item, lockedFields) => boolean
}

export type EditInputFieldDefinition = InputFieldDefinition & {}

export type HeaderRenderFieldDefinition = {
  width?: string
  align?: string
  hideUnder?: 'sm' | 'md' | 'lg' | 'xl' // hide this column if viewport is smaller than this
  hideIfDialog?: boolean // hide this column if shown in a dialog element
  hideIfGrid?: boolean // hide this column if in grid mode
  hideIfList?: boolean // hide this column if in list mode
  hideIf?: (that) => boolean
  hideTitleIfGrid?: boolean // hide the header if in a grid
} & RenderFieldDefinition

export type ViewRenderFieldDefinition = {
  // whether or not to show the key:val combo vertically
  verticalMode?: boolean
} & RenderFieldDefinition

export type RenderFieldDefinition = {
  // if renderDefinition is undefined, attempt to look it up using the fieldKey
  fieldKey: string
  renderDefinition?: RenderDefinition
  hideIf?: (that, fieldValue, item, inputsArray) => boolean
}

export type ImportFieldDefinition = {
  // the fieldpath that should be imported, in dot notation
  fieldPath: string

  // for parsing CSV imports
  parseValue?: (val: any) => unknown

  // the corresponding lockedFieldPath (if different from fieldPath)
  lockedFieldPath?: string
}

export type BatchUpdateFieldDefinition = {
  // the fieldpath that should be updated, in dot notation
  fieldPath: string

  // for parsing CSV imports
  parseValue?: (val: any) => unknown
}

export type ExportFieldDefinition = {
  // the fieldpath that should be exported
  fieldPath: string

  title?: string

  // should the field be excluded if this returns true
  hideIf?: (that) => boolean

  args?: {
    getArgs: (that) => any
    path: string
  }[]

  serialize?: (that, value) => any
}

export type PriceObject = {
  price: number // 100
  quantity?: number // 2
  discount?: number // 5
  discountPercent?: number // 5
  fees?: number
  feesPercent?: number
}
