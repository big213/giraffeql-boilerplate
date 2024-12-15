import { handleUserRefreshed } from '~/services/auth'
import { User } from '../../base/user'
import { RecordInfo } from '~/types'

export const MyProfile: RecordInfo<'user'> = {
  ...User,
  title: 'My Profile',
  routeType: 'my',
  editOptions: {
    fields: ['avatarUrl', 'name', 'description', 'isPublic'],
    onSuccess: (that) => {
      // refresh the store entry after editing profile
      handleUserRefreshed(that)
    },
  },
  viewOptions: {
    ...User.viewOptions,
    fields: ['isPublic', 'description'],
  },
  deleteOptions: undefined,
  expandTypes: [],
}
