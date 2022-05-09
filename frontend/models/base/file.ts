import type { RecordInfo } from '~/types'
import FilesizeColumn from '~/components/table/filesizeColumn.vue'
import FileColumn from '~/components/table/fileColumn.vue'
import { generateBaseFields } from '~/services/recordInfo'

export const File = <RecordInfo<'file'>>{
  typename: 'file',
  pluralTypename: 'files',
  name: 'File',
  pluralName: 'Files',
  icon: 'mdi-file',
  renderItem: (item) => item.name,
  fields: {
    ...generateBaseFields({
      hasName: true,
    }),
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
    hasSearch: false,
    filterOptions: [],
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog('view', item)
    },
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
      {
        field: 'updatedAt',
        desc: true,
      },
    ],
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
        field: 'createdAt',
        width: '150px',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
    downloadOptions: {},
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
