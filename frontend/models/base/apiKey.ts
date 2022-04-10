import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import { generateJoinableField } from '~/services/recordInfo'

export const ApiKey = <RecordInfo<'apiKey'>>{
  typename: 'apiKey',
  pluralTypename: 'apiKeys',
  name: 'API Key',
  pluralName: 'API Keys',
  icon: 'mdi-view-grid-plus',
  renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    name: {
      text: 'Name',
    },
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
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
  },
  paginationOptions: {
    hasSearch: false,
    myFilterField: (that) => {
      return [
        {
          field: 'user',
          operator: 'eq',
          value: that.$store.getters['auth/user'].id,
        },
      ]
    },
    filterOptions: [],
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
