import { ViewDefinition } from '~/types/view'
import { baseViews } from '..'

export const Settings: ViewDefinition = {
  ...baseViews.User,
  routeType: 'my',
  title: `My Settings`,
  updateOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
  enterOptions: undefined,
  shareOptions: undefined,
}
