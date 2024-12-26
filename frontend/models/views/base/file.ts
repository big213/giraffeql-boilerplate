import { ViewDefinition } from '~/types/view'
import { FileEntity } from '~/models/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateSortOptions,
} from '~/services/view'
import FilesizeColumn from '~/components/table/filesizeColumn.vue'
import FileColumn from '~/components/table/fileColumn.vue'

export const BaseFileView: ViewDefinition = {
  routeType: 'a',
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
      component: FileColumn,
    },
    size: {
      text: 'Size',
      component: FilesizeColumn,
    },
    location: {
      text: 'Location',
    },
    contentType: {
      text: 'Content Type',
    },
    parentKey: {
      text: 'Parent Key',
    },
  },
  paginationOptions: {
    filterOptions: [],
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog('view', item)
    },
    sortOptions: [
      ...generateSortOptions({ field: 'createdAt' }),
      ...generateSortOptions({ field: 'updatedAt' }),
    ],
    headerOptions: [
      {
        field: 'nameWithId',
        hideTitleIfGrid: true,
      },
      {
        field: 'contentType',
        width: '200px',
      },
      {
        field: 'size',
        width: '150px',
        align: 'right',
      },
      {
        field: 'updatedAt',
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
