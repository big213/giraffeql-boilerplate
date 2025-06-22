import {
  FilterInputFieldDefinition,
  InputDefinition,
  NestedInputFieldDefinition,
} from '.'

// used in crud.js
export type SortObjectCrud = {
  text: string
  field: string
  desc: boolean
}

// used in crud.js, for the genericFilterInput
export type CrudFilterObject = {
  filterInputFieldDefinition: FilterInputFieldDefinition
  inputObject: CrudInputObject
}

export type NestedInputObject = {
  nestedInputFieldDefinition: NestedInputFieldDefinition
  inputObject: CrudInputObject
}

// used for the genericInput
export type CrudInputObject = {
  fieldKey: string // the fieldKey
  fieldPath: string // the path to the field
  viewDefinition?: any | null // viewDefinition, if any
  label: string // the label for the input
  closeable?: boolean // is the input closeable?
  inputDefinition: InputDefinition // various extra options relating to the specific inputType
  value: any // the actual value of the input
  inputValue: any // the proxy value of the input
  secondaryInputValue: any // a secondary proxy value, for compound fields (like stripe-pi)
  // function that will get run whenever a file gets added to the input (if it is a file input)
  handleFileAdded?: (that, inputsArray, inputObject, fileRecord) => void
  options: any[] // the options of the input, if it applies
  readonly?: boolean // is the input readonly?
  hidden: boolean // is the input hidden (not visible?)
  loading: boolean // is the input loading?
  focused: boolean // is the input focused?
  cols?: number // how many cols does the input take up? defaults to 12
  generation: number // generation of the input. used for forcing refreshes
  parentInput: CrudInputObject | null // the parent of the input. can be used to determine if it is nested as well
  nestedInputsArray: (NestedInputObject | NestedInputObject[])[] // any nested input objects
  hideIf?: (that, parentItem, inputsArray) => boolean // hide this input if...
  inputData?: any // additional data that is relevant for the input option (mainly for stripe-pi)
  watch?: (that, val, prev) => void
}

export type CrudHeaderFieldDefinition = {
  text: string
  align?: string
  sortable?: boolean // should always be false or undefined
  value: string | null
  width: string | number | null
  fieldInfo?: any
  path?: string | null
}

// used to communicate how to display the page data
export type CrudPageOptions = {
  search: string | null
  filters: CrudRawFilterObject[]
  distance?: CrudRawDistanceObject[]
  sort: string | null
}

// used in crud.js
export type CrudRawFilterObject = {
  field: string
  operator: string
  value: any
}

export type CrudRawDistanceObject = {
  key: string
  latitude: number
  longitude: number
  gt?: number | null
  lt?: number | null
}

export type CrudRawSortObject = {
  field: string
  desc: boolean
}

// { "abc.def.id": "someid"}
export type LockedFieldObject = {
  [x: string]: string
}
