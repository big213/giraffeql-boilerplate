import {
  getUserPermissionEnumValues,
  getUserRoleEnumValues,
} from '~/services/dropdown'
import type { RecordInfo } from '~/types'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import FollowColumn from '~/components/table/followColumn.vue'
import {
  generateBaseFields,
  generateClickRowToOpenDialogOptions,
  generateIsPublicField,
  generateSortOptions,
} from '~/services/recordInfo'
import { SimpleUser } from '../simple'
import ChipColumn from '~/components/table/chipColumn.vue'
import { userRoleMap } from '~/services/constants'

export const User: RecordInfo<'user'> = {
  ...SimpleUser,
  routeType: 'a',
  requiredFields: ['avatarUrl', 'name'],
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
      getOptions: getUserRoleEnumValues,
      inputType: 'select',
      component: ChipColumn,
      columnOptions: {
        smallMode: true,
        valuesMap: userRoleMap,
      },
    },
    permissions: {
      text: 'Custom Permissions',
      inputType: 'multiple-select',
      getOptions: getUserPermissionEnumValues,
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
    ...generateClickRowToOpenDialogOptions(),
    sortOptions: [
      ...generateSortOptions('createdAt'),
      ...generateSortOptions('updatedAt'),
    ],
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
      'avatarUrl',
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
      'avatarUrl',
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
      'avatarUrl',
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
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
