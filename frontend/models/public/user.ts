import { User } from '../base'

export const PublicUser = {
  ...User,
  title: `Public ${User.pluralName}`,
  paginationOptions: {
    ...(!!User.paginationOptions && User.paginationOptions),
    filterOptions: [],
    headerOptions: [
      {
        field: 'record',
        hideIfGrid: true,
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
