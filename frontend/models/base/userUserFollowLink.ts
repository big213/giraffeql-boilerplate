import type { RecordInfo } from '~/types'
import {
  generateBaseLinkFields,
  generateJoinableField,
  generatePreviewableRecordField,
} from '~/services/recordInfo'

export const UserUserFollowLink = <RecordInfo<'userUserFollowLink'>>{
  typename: 'userUserFollowLink',
  pluralTypename: 'userUserFollowLinks',
  name: 'UserUserFollowLink',
  pluralName: 'UserUserFollowLinks',
  icon: 'mdi-link',
  renderItem: (item) => item.name,
  fields: {
    ...generateBaseLinkFields(),
    user: generateJoinableField({
      text: 'User',
      fieldname: 'user',
      typename: 'user',
      hasAvatar: true,
    }),
    userRecord: generatePreviewableRecordField({
      fieldname: 'user',
      text: 'User',
    }),
    target: generateJoinableField({
      text: 'Target',
      fieldname: 'target',
      typename: 'user',
      hasAvatar: true,
    }),
    targetRecord: generatePreviewableRecordField({
      fieldname: 'target',
      text: 'Target',
    }),
  },
  paginationOptions: {
    hasSearch: false,
    filterOptions: [],
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
    ],
    headerOptions: [
      {
        field: 'userRecord',
      },
      {
        field: 'targetRecord',
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
    fields: ['user', 'target'],
  },
  importOptions: {
    fields: ['user', 'target'],
  },
  editOptions: {
    fields: ['user', 'target'],
  },
  viewOptions: {
    fields: ['userRecord', 'targetRecord'],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
