import { ViewDefinition } from '~/types/view'
import { BaseFileView } from '../base'
import { fileUploadMultiple } from '~/models/actions'

export const MyFileView: ViewDefinition = {
  ...BaseFileView,
  routeType: 'my',
  title: `My ${BaseFileView.entity.pluralName}`,
  paginationOptions: {
    ...BaseFileView.paginationOptions!,
    defaultLockedFilters: (that) => {
      return [
        {
          field: 'createdBy.id',
          operator: 'eq',
          value: that.$store.getters['auth/user'].id,
        },
      ]
    },
    downloadOptions: undefined,
  },
  viewOptions: {
    fields: ['nameWithId', 'size', 'contentType', 'parentKey'],
  },
  generateOptions: {
    buttonText: 'Upload',
    buttonIcon: 'mdi-upload-multiple',
    action: fileUploadMultiple,
  },
  createOptions: undefined,
  shareOptions: undefined,
  enterOptions: undefined,
}
