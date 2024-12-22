import { ViewDefinition } from '~/types/view'
import { handleUserRefreshed } from '~/services/auth'
import { BaseUserView } from '../base'

export const MyProfileView: ViewDefinition = {
  ...BaseUserView,
  routeType: 'my',
  title: `My Profile`,
  updateOptions: {
    fields: ['avatarUrl', 'name', 'description', 'isPublic'],
    onSuccess: (that) => {
      // refresh the store entry after editing profile
      handleUserRefreshed(that)
    },
  },
  viewOptions: {
    ...BaseUserView.viewOptions,
    fields: ['isPublic', 'description'],
  },
  deleteOptions: undefined,
  childTypes: [],
}
