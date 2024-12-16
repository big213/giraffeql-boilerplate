import { ViewDefinition } from '~/types/view'
import { baseViews } from '..'
import { ApiKeyEntity } from '~/models2/entities'

export const ApiKey: ViewDefinition = {
  ...baseViews.ApiKey,
  routeType: 'my',
  title: `My ${ApiKeyEntity.pluralName}`,
  paginationOptions: {
    ...baseViews.ApiKey.paginationOptions!,
    defaultLockedFilters: (that) => {
      return [
        {
          field: 'user.id',
          operator: 'eq',
          value: that.$store.getters['auth/user'].id,
        },
      ]
    },
    downloadOptions: undefined,
  },
  enterOptions: {},
}
