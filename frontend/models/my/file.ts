import { File } from '../base'

export const MyFile = {
  ...File,
  title: `My ${File.pluralName}`,
  routeType: 'my',
  paginationOptions: {
    ...File.paginationOptions,
    downloadOptions: undefined,
  },
  viewOptions: undefined,
  shareOptions: undefined,
  enterOptions: {
    routeType: 'my',
  },
  editOptions: undefined,
  addOptions: undefined,
}
