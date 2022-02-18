import { FilterObject, InputType } from '.'

// used in crud.js
export type SortObjectCrud = {
  text: string
  field: string
  desc: boolean
}

// used in crud.js, for the genericFilterInput
export type CrudFilterObject = {
  filterObject: FilterObject
  inputObject: CrudInputObject
}

export type NestedInputObject = {
  inputObject: CrudInputObject
  nestedFieldInfo: any // InputOptions.nestedFields
}

// used for the genericInput
export type CrudInputObject = {
  fieldKey: string // the fieldKey
  primaryField?: string // the main field. either fieldInfo.fields[0] or the fieldKey
  fieldInfo?: any // fieldInfo
  recordInfo?: any | null // recordInfo, if any
  inputType: InputType
  label: string // the label for the input
  hint?: string | null // the hint for the input
  clearable?: boolean // is the input clearable?
  closeable?: boolean // is the input closeable?
  optional?: boolean // is the input optional?
  inputRules?: any[] // array of validators for the input
  inputOptions?: {
    [x in string]: any
  } // various extra options relating to the specific inputType
  value: any // the actual value of the input
  inputValue: any // the proxy value of the input
  getOptions?: (that) => any
  options: any[] // the options of the input, if it applies
  readonly?: boolean // is the input readonly?
  loading: boolean // is the input loading?
  focused: boolean // is the input focused?
  cols?: number // how many cols does the input take up? defaults to 12
  generation: number // generation of the input. used for forcing refreshes
  parentInput: CrudInputObject | null // the parent of the input. can be used to determine if it is nested as well
  nestedInputsArray: NestedInputObject[][] // any nested input objects
}

export type CrudHeaderObject = {
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
  sort: CrudRawSortObject | null
}

// used in crud.js
export type CrudRawFilterObject = {
  field: string
  operator: string
  value: any
}

export type CrudRawSortObject = {
  field: string
  desc: boolean
}
