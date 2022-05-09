import type { RecordInfo } from '~/types'

export const SimpleUser = <Partial<RecordInfo<'user'>>>{
  typename: 'user',
  pluralTypename: 'users',
  name: 'User',
  pluralName: 'Users',
  icon: 'mdi-account',
  renderItem: (item) => item.email,
  followLinkModel: 'userUserFollowLink',
  fields: {},
  previewOptions: {
    fields: ['__typename'],
  },
}
