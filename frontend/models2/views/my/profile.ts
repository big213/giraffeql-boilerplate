import { ViewDefinition } from '~/types/view'
import { baseViews } from '..'
import { handleUserRefreshed } from '~/services/auth'

export const Profile: ViewDefinition = {
  ...baseViews.User,
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
    ...baseViews.User.viewOptions,
    fields: ['isPublic', 'description'],
  },
  deleteOptions: undefined,
  childTypes: [],
}
