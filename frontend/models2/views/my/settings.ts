import { ViewDefinition } from '~/types/view'
import { BaseUserView } from '../base'

export const MySettingsView: ViewDefinition = {
  ...BaseUserView,
  routeType: 'my',
  title: `My Settings`,
  updateOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
  enterOptions: undefined,
  shareOptions: undefined,
}
