import { User } from '../base'

export const MyProfile = {
  ...User,
  routeName: 'i-view',
  paginationOptions: {
    ...(!!User.paginationOptions && User.paginationOptions),
    filterOptions: [],
    headerOptions: [
      {
        field: 'nameWithAvatar',
      },
      {
        field: 'createdAt',
        width: '150px',
      },
    ],
    downloadOptions: undefined,
  },
  editOptions: {
    fields: ['avatar', 'name', 'isPublic'],
  },
  viewOptions: {
    fields: ['avatar', 'name', 'isPublic'],
  },
  deleteOptions: undefined,
  expandTypes: [],
}
