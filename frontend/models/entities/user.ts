import { EntityDefinition } from '~/types/entity'

export const UserEntity: EntityDefinition = {
  typename: 'user',
  name: 'User',
  pluralName: 'Users',
  nameField: 'name',
  avatarField: 'avatar',
  descriptionField: 'description',
  icon: 'mdi-account',
}
