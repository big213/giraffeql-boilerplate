import { User } from '../../base'

export const MySettings = {
  ...User,
  title: 'My Settings',
  routeType: 'my',
  paginationOptions: {
    ...User.paginationOptions,
  },
  editOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
  enterOptions: undefined,
  shareOptions: undefined,
}
