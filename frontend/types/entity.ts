export type EntityDefinition = {
  typename: string
  name: string
  pluralName: string
  icon?: string
  nameField?: string
  // if the render name field is different from the input name field
  nameInputField?: string
  avatarField?: string
  descriptionField?: string
}
