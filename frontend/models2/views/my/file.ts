import { ViewDefinition } from '~/types/view'
import { BaseFileView } from '../base'

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
  shareOptions: undefined,
  enterOptions: undefined,
  updateOptions: undefined,
  createOptions: undefined,
}
