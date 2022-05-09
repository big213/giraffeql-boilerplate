import { getUserRoles } from '~/services/dropdown'
import type { RecordInfo } from '~/types'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import FollowColumn from '~/components/table/followColumn.vue'
import { generateBaseFields } from '~/services/recordInfo'

export const User = <RecordInfo<'user'>>{
  typename: 'user',
  pluralTypename: 'users',
  name: 'User',
  pluralName: 'Users',
  icon: 'mdi-account',
  requiredFields: ['avatar', 'name'],
  renderItem: (item) => item.email,
  fields: {
    ...generateBaseFields({
      hasName: true,
      hasAvatar: true,
      hasDescription: false,
    }),
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
    isPublic: {
      text: 'Is Public',
      component: BooleanColumn,
      inputType: 'switch',
      default: () => true,
    },
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
    hasSearch: true,
    heroOptions: {},
    filterOptions: [
      {
        field: 'role',
        operator: 'eq',
      },
    ],
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
    fields: ['name', 'email', 'password', 'role', 'permissions', 'isPublic'],
  },
  editOptions: {
    fields: ['name', 'email', 'role', 'permissions', 'isPublic'],
  },
  viewOptions: {
    fields: [
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
