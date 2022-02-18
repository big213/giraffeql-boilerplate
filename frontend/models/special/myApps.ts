import { ApiKey } from '../base'

export const MyApps = {
  ...ApiKey,
  routeName: 'i-view',
  paginationOptions: {
    ...ApiKey.paginationOptions,
    downloadOptions: undefined,
  },
}
