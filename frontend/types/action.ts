import { InputDefinition, InputFieldDefinition } from '.'

export type ActionDefinition = {
  title: string
  icon: string

  // if there is a singular giraffeql operation to execute
  operationName?: string

  // if there is a custom function to execute when submitted. the item returned will be passed to onSuccess function as "item"
  onSubmit?: (that, item, args) => Promise<any> | any

  // is login required? if so, it will redirect to login if not logged in
  isLoginRequired?: boolean

  // override submit button text
  submitButtonText?: string

  // hide the actions bar entirely (since stripe-pi has its own button)
  hideActionsIf?: (that, item) => any

  // custom component, if any
  component?: any

  // the query to return with the action, if any
  getReturnQuery?: (that, item) => any

  // function that runs when action is successfully completed
  onSuccess?: (that, item, returnData) => void

  fields: ActionInputFieldDefinition[]

  // function that will use the parenItem to modify the args fed into the operation
  argsModifier?: (that, item, args) => void
  // modifier function that will use the original item to assemble the lockedFields (for pre-populating fields in the executeActionInterface)
  getLockedFields?: (that, item) => any
}

export type ActionInputFieldDefinition = InputFieldDefinition & {
  inputDefinition: InputDefinition
  // should this input be hidden if it is locked? -- only applies to create and actions
  hideIfLocked?: boolean

  // exclude the input entirely at initialization based on the snapshot -- only applies to create and actions
  excludeIf?: (that, item, lockedFields) => boolean
}
