import type { RecordInfo } from '~/types'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import {
  generateBaseFields,
  generateJoinableField,
} from '~/services/recordInfo'

export const ApiKey = <RecordInfo<'apiKey'>>{
  typename: 'apiKey',
  pluralTypename: 'apiKeys',
  name: 'API Key',
  pluralName: 'API Keys',
  icon: 'mdi-view-grid-plus',
  renderItem: (item) => item.name,
  fields: {
    ...generateBaseFields({
      hasName: true,
    }),
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
    user: generateJoinableField({
      text: 'User',
      fieldname: 'user',
      typename: 'user',
      hasAvatar: true,
    }),
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
    ],
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
    fields: ['name', 'permissions', 'user'],
  },
  editOptions: {
    fields: ['name', 'permissions'],
  },
  viewOptions: {
    fields: ['name', 'permissions', 'code', 'user'],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: undefined,

  expandTypes: [],
}
