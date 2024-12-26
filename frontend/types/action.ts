import { InputFieldDefinition } from '.'

export type ActionDefinition = {
  title: string
  icon: string

  // if there is a singular giraffeql operation to execute
  operationName?: string

  // if there is a custom function to execute when submitted
  onSubmit?: (that, item, args) => void

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
  onSuccess?: (that, item) => void
  inputFields: {
    fieldPath: string
    definition: InputFieldDefinition

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
