import { ViewDefinition } from '~/types/view'
import { ApiKeyEntity } from '~/models2/entities'
import { BaseApiKeyView } from '../base'

export const MyApiKeyView: ViewDefinition = {
  ...BaseApiKeyView,
  routeType: 'my',
  title: `My ${ApiKeyEntity.pluralName}`,
  paginationOptions: {
    ...BaseApiKeyView.paginationOptions!,
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
