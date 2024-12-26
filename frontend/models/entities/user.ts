import { EntityDefinition } from '~/types/entity'

export const UserEntity: EntityDefinition = {
  typename: 'user',
  name: 'User',
  pluralName: 'Users',
  nameField: 'name',
  avatarField: 'avatarUrl',
  descriptionField: 'description',
  icon: 'mdi-account',
}
