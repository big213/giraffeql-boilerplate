import { ApiKey } from '../../base'

export const MyApiKey = {
  ...ApiKey,
  routeType: 'my',
  title: `My ${ApiKey.pluralName}`,
  paginationOptions: {
    ...ApiKey.paginationOptions,
    defaultLockedFilters: (that) => {
      return [
        {
          field: 'user',
          operator: 'eq',
          value: that.$store.getters['auth/user'].id,
        },
      ]
    },
    downloadOptions: undefined,
  },
  enterOptions: {},
}
