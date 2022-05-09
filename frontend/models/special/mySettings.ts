import { User } from '../base'

export const MySettings = {
  ...User,
  title: 'My Settings',
  editOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
}
