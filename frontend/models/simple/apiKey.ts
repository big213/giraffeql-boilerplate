import type { SimpleRecordInfo } from '~/types'

export const SimpleApiKey = <SimpleRecordInfo<'apiKey'>>{
  typename: 'apiKey',
  pluralTypename: 'apiKeys',
  name: 'API Key',
  pluralName: 'API Keys',
  icon: 'mdi-view-grid-plus',
  hasName: true,
  hasAvatar: true,
  hasDescription: true,
}
