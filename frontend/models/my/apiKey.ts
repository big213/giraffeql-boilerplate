import { ApiKey } from '../base'

export const MyApiKey = {
  ...ApiKey,
  title: `My ${ApiKey.pluralName}`,
  paginationOptions: {
    ...ApiKey.paginationOptions,
    downloadOptions: undefined,
  },
  enterOptions: {
    routeType: 'my',
  },
}
