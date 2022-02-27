import { User } from '../base'

export const PublicUser = {
  ...User,
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
  routeName: 'i-view',
  viewOptions: {
    fields: ['avatar', 'name', 'isPublic'],
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  importOptions: undefined,
}
