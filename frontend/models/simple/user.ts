import type { RecordInfo } from '~/types'

export const SimpleUser = <Partial<RecordInfo<'user'>>>{
  typename: 'user',
  pluralTypename: 'users',
  name: 'User',
  pluralName: 'Users',
  icon: 'mdi-account',
  hasName: true,
  hasAvatar: true,
  hasDescription: true,
  renderItem: (item) => item.email,
  followLinkModel: 'userUserFollowLink',
  previewOptions: {
    fields: ['__typename'],
    heroOptions: {},
  },
}
