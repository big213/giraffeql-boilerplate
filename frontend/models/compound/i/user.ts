import type { RecordInfo } from '~/types'
import { User } from '~/models/base'

export const PublicUser: RecordInfo<'user'> = {
  ...User,
  title: `Public ${User.pluralName}`,
  routeType: 'i',
  paginationOptions: {
    ...User.paginationOptions!,
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
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  enterOptions: {},
  expandTypes: [],
}
