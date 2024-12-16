import { ViewDefinition } from '~/types/view'
import { baseViews } from '..'

export const File: ViewDefinition = {
  ...baseViews.File,
  routeType: 'my',
  title: `My ${baseViews.File.entityDefinition.pluralName}`,
  paginationOptions: {
    ...baseViews.File.paginationOptions!,
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
