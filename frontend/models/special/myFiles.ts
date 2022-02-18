import { File } from '../base'

export const MyFiles = {
  ...File,
  paginationOptions: {
    ...File.paginationOptions,
    downloadOptions: undefined,
  },
  viewOptions: undefined,
  shareOptions: undefined,
  enterOptions: undefined,
  editOptions: undefined,
  addOptions: undefined,
}
