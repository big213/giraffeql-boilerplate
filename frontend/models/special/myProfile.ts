import { handleUserRefreshed } from '~/services/auth'
import { User } from '../base'

export const MyProfile = {
  ...User,
  title: 'My Profile',
  paginationOptions: {
    ...(!!User.paginationOptions && User.paginationOptions),
    filterOptions: [],
    headerOptions: [
      {
        field: 'nameWithAvatar',
        hideIfGrid: true,
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
    onSuccess: (that) => {
      // refresh the store entry after editing profile
      handleUserRefreshed(that)
    },
  },
  viewOptions: {
    ...User.viewOptions,
    fields: ['isPublic', 'currentUserFollowing'],
  },
  deleteOptions: undefined,
}
