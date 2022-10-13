import { handleUserRefreshed } from '~/services/auth'
import { User } from '../base/user'

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
        field: 'updatedAt',
        width: '150px',
      },
    ],
    downloadOptions: undefined,
  },
  editOptions: {
    fields: ['avatar', 'name', 'description', 'isPublic'],
    onSuccess: (that) => {
      // refresh the store entry after editing profile
      handleUserRefreshed(that)
    },
  },
  viewOptions: {
    ...User.viewOptions,
    fields: ['isPublic', 'description', 'currentUserFollowing'],
  },
  deleteOptions: undefined,
  expandTypes: [],
}
