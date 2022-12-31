import type { RecordInfo } from '~/types'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import {
  generateBaseFields,
  generatePreviewableJoinableField,
  generateSortOptions,
} from '~/services/recordInfo'
import { SimpleApiKey } from '../simple'

export const ApiKey = <RecordInfo<'apiKey'>>{
  ...SimpleApiKey,
  fields: {
    ...generateBaseFields(SimpleApiKey),
    code: {
      text: 'Code',
      component: CopyableColumn,
    },
    permissions: {
      text: 'Permissions',
      optional: true,
      hint: 'Only use this to specify custom permissions, comma-separated',
      serialize: (val: string[]) => val && val.join(','),
      parseValue: (val: string) =>
        val ? val.split(',').filter((ele) => ele) : [],
    },
    ...generatePreviewableJoinableField({
      text: 'User',
      fieldname: 'user',
      typename: 'user',
    }),
  },
  paginationOptions: {
    searchOptions: undefined,
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
        field: 'name',
        hideIfGrid: true,
      },
      {
        field: 'code',
        width: '250px',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
  },
  addOptions: {
    fields: ['name', 'permissions', 'user'],
  },
  editOptions: {
    fields: ['name', 'permissions'],
  },
  viewOptions: {
    fields: ['name', 'permissions', 'code', 'userRecord'],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: undefined,

  expandTypes: [],
}
