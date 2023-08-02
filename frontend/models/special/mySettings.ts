import { User } from '../base'

export const MySettings = {
  ...User,
  title: 'My Settings',
  routeType: 'my',
  editOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
}
