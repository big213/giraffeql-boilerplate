import { ViewDefinition } from '~/types/view'
import { BaseUserView } from '../base'

export const MySettingsView: ViewDefinition = {
  ...BaseUserView,
  routeType: 'my',
  routeKey: 'settings',
  title: `My Settings`,
  pageOptions: {
    ...BaseUserView.pageOptions,
    getLookupParams: (that) => {
      return {
        id: that.$store.getters['auth/user']?.id,
      }
    },
  },
  updateOptions: {
    fields: ['isPublic', 'allowEmailNotifications'],
  },
  enterOptions: undefined,
  shareOptions: undefined,
}
