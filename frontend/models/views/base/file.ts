import { ViewDefinition } from '~/types/view'
import { FileEntity } from '~/models/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateClickRowToOpenDialogOptions,
  generateSortOptions,
} from '~/services/view'
import { Columns } from '~/services/components'

export const BaseFileView: ViewDefinition = {
  routeType: 'base',
  routeKey: FileEntity.typename,
  entity: FileEntity,
  inputFields: {
    ...generateBaseInputFields(FileEntity),
    location: {},
  },
  renderFields: {
    ...generateBaseRenderFields(FileEntity),
    nameWithId: {
      text: 'File',
      fields: ['name', 'id', 'location'],
      component: Columns.FileColumn,
    },
    size: {
      component: Columns.FilesizeColumn,
    },
    location: {},
    contentType: {},
    parentKey: {},
  },
  paginationOptions: {
    filters: [],
    ...generateClickRowToOpenDialogOptions(),
    sortFields: [
      ...generateSortOptions({ fieldPath: 'createdAt' }),
      ...generateSortOptions({ fieldPath: 'updatedAt' }),
    ],
    headers: [
      {
        fieldKey: 'nameWithId',
        hideTitleIfGrid: true,
      },
      {
        fieldKey: 'contentType',
        width: '200px',
      },
      {
        fieldKey: 'size',
        width: '150px',
        align: 'right',
      },
      {
        fieldKey: 'updatedAt',
        width: '150px',
      },
    ],
  },
  createOptions: {
    fields: ['name', 'location'],
  },
  updateOptions: {
    fields: ['name'],
  },
  viewOptions: {
    fields: ['nameWithId', 'size', 'contentType', 'location', 'parentKey'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  childTypes: [],
}
