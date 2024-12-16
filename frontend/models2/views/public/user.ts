import { ViewDefinition } from '~/types/view'
import { baseViews } from '..'
import { UserEntity } from '~/models2/entities'

export const User: ViewDefinition = {
  ...baseViews.User,
  routeType: 'i',
  title: `Public ${UserEntity.pluralName}`,
  paginationOptions: {
    ...baseViews.User.paginationOptions!,
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
