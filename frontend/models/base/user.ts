import { getUserRoles } from '~/services/dropdown'
import type { RecordInfo } from '~/types'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import FollowColumn from '~/components/table/followColumn.vue'
import {
  generateBaseFields,
  generateClickRowToOpenOptions,
  generateIsPublicField,
  generateSortOptions,
} from '~/services/recordInfo'
import { SimpleUser } from '../simple'

export const User = <RecordInfo<'user'>>{
  ...SimpleUser,
  requiredFields: ['avatar', 'name'],
  fields: {
    ...generateBaseFields(SimpleUser),
    email: {
      text: 'Email',
    },
    password: {
      text: 'Password',
      hidden: true,
    },
    role: {
      text: 'User Role',
      getOptions: getUserRoles,
      inputType: 'select',
    },
    permissions: {
      text: 'Custom Permissions',
      serialize: (val: string[]) => val && val.join(','),
      parseValue: (val: string) =>
        val ? val.split(',').filter((ele) => ele) : [],
    },
    ...generateIsPublicField(),
    allowEmailNotifications: {
      text: 'Allow Email Notifications',
      component: BooleanColumn,
      inputType: 'switch',
      default: () => true,
    },
    currentUserFollowing: {
      text: 'Follow',
      fields: ['currentUserFollowLink.id'],
      component: FollowColumn,
    },
  },
  paginationOptions: {
    searchOptions: {},
    heroOptions: {},
    filterOptions: [
      {
        field: 'role',
        operator: 'eq',
      },
    ],
    ...generateClickRowToOpenOptions(),
    sortOptions: [...generateSortOptions('updatedAt')],
    headerOptions: [
      {
        field: 'nameWithAvatar',
        hideIfGrid: true,
      },
      {
        field: 'email',
        width: '150px',
      },
      {
        field: 'role',
        width: '150px',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
  },

  addOptions: {
    fields: [
      'avatar',
      'name',
      'description',
      'email',
      'password',
      'role',
      'permissions',
      'isPublic',
    ],
  },
  editOptions: {
    fields: [
      'avatar',
      'name',
      'description',
      'email',
      'role',
      'permissions',
      'isPublic',
    ],
  },
  viewOptions: {
    fields: [
      'avatar',
      'name',
      'description',
      'email',
      'role',
      'permissions',
      'isPublic',
      'currentUserFollowing',
    ],
    heroOptions: {},
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
