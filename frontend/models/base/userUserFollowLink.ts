import type { RecordInfo } from '~/types'
import {
  generateBaseLinkFields,
  generatePreviewableJoinableField,
  generateSortOptions,
} from '~/services/recordInfo'
import { SimpleUserUserFollowLink } from '../simple'

export const UserUserFollowLink: RecordInfo<'userUserFollowLink'> = {
  ...SimpleUserUserFollowLink,
  routeType: 'a',
  fields: {
    ...generateBaseLinkFields(SimpleUserUserFollowLink),
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
    searchOptions: undefined,
    filterOptions: [],
    sortOptions: [
      ...generateSortOptions('createdAt'),
      ...generateSortOptions('updatedAt'),
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
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
