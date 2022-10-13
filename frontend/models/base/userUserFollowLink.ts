import type { RecordInfo } from '~/types'
import {
  generateBaseLinkFields,
  generatePreviewableJoinableField,
} from '~/services/recordInfo'
import { SimpleUserUserFollowLink } from '../simple'

export const UserUserFollowLink = <RecordInfo<'userUserFollowLink'>>{
  ...SimpleUserUserFollowLink,
  fields: {
    ...generateBaseLinkFields(),
    ...generatePreviewableJoinableField({
      text: 'User',
      fieldname: 'user',
      typename: 'user',
    }),
    ...generatePreviewableJoinableField({
      text: 'Target',
      fieldname: 'target',
      typename: 'user',
    }),
  },
  paginationOptions: {
    hasSearch: false,
    filterOptions: [],
    sortOptions: [
      {
        field: 'updatedAt',
        desc: true,
      },
      {
        field: 'updatedAt',
        desc: false,
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
        field: 'updatedAt',
        width: '150px',
      },
    ],
  },
  addOptions: {
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
