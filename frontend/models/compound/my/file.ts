import { File } from '../../base'

export const MyFile = {
  ...File,
  title: `My ${File.pluralName}`,
  routeType: 'my',
  paginationOptions: {
    ...File.paginationOptions,
    downloadOptions: undefined,
  },
  viewOptions: {
    fields: ['nameWithId', 'size', 'contentType', 'parentKey'],
  },
  shareOptions: undefined,
  enterOptions: undefined,
  editOptions: undefined,
  addOptions: undefined,
}
