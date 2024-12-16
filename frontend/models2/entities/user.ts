import { EntityDefinition } from '~/types/view'

export const UserEntity: EntityDefinition = {
  typename: 'user',
  name: 'User',
  pluralName: 'Users',
  nameField: 'name',
  avatarField: 'avatarUrl',
  descriptionField: 'description',
  icon: 'mdi-account',
}
