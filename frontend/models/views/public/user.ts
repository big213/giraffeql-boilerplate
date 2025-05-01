import { ViewDefinition } from '~/types/view'
import { UserEntity } from '~/models/entities'
import { BaseUserView } from '../base'

export const PublicUserView: ViewDefinition = {
  ...BaseUserView,
  routeType: 'public',
  title: `Public ${UserEntity.pluralName}`,
  paginationOptions: {
    ...BaseUserView.paginationOptions!,
    defaultLockedFilters: (_that) => {
      return [
        {
          field: 'isPublic',
          operator: 'eq',
          value: true,
        },
      ]
    },
    filters: [],
    headers: [
      {
        fieldKey: 'nameWithAvatar',
        hideIfGrid: true,
      },
    ],
    downloadOptions: undefined,
    importOptions: undefined,
  },
  createOptions: undefined,
  updateOptions: undefined,
  deleteOptions: undefined,
  enterOptions: {},
  childTypes: [],
}
