import type { RecordInfo } from '~/types'
import { User } from '../../base'

export const MySettings: RecordInfo<'user'> = {
  ...User,
  title: 'My Settings',
  routeType: 'my',
  paginationOptions: {
    ...User.paginationOptions!,
  },
  editOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
  enterOptions: undefined,
  shareOptions: undefined,
}
