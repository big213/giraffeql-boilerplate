import { ViewDefinition } from '~/types/view'
import { UserEntity } from '~/models2/entities'
import { BaseUserView } from '../base'

export const PublicUserView: ViewDefinition = {
  ...BaseUserView,
  routeType: 'i',
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
    filterOptions: [],
    headerOptions: [
      {
        field: 'nameWithAvatar',
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
