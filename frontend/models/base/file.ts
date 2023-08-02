import type { RecordInfo } from '~/types'
import FilesizeColumn from '~/components/table/filesizeColumn.vue'
import FileColumn from '~/components/table/fileColumn.vue'
import { generateBaseFields, generateSortOptions } from '~/services/recordInfo'
import { SimpleFile } from '../simple'

export const File = <RecordInfo<'file'>>{
  ...SimpleFile,
  routeType: 'a',
  fields: {
    ...generateBaseFields(SimpleFile),
    nameWithId: {
      text: 'File',
      fields: ['name', 'id'],
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
  },
  paginationOptions: {
    filterOptions: [],
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog('view', item)
    },
    sortOptions: [...generateSortOptions('updatedAt')],
    headerOptions: [
      {
        field: 'nameWithId',
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
  addOptions: {
    fields: ['name', 'location'],
  },
  editOptions: {
    fields: ['name'],
  },
  viewOptions: {
    fields: ['name', 'size', 'contentType', 'location'],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
