import { User } from '../base'

export const PublicUser = {
  ...User,
  title: 'Public Users',
  paginationOptions: {
    ...(!!User.paginationOptions && User.paginationOptions),
    filterOptions: [],
    headerOptions: [
      {
        field: 'record',
      },
      {
        field: 'createdAt',
        width: '150px',
      },
    ],
    downloadOptions: undefined,
  },
  viewOptions: {
    fields: ['avatar', 'name', 'isPublic', 'currentUserFollowing'],
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  importOptions: undefined,
  enterOptions: {
    routeType: 'i',
  },
}
