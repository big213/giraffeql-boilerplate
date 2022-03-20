import { getUserRoles } from '~/services/dropdown'
import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import FollowColumn from '~/components/table/followColumn.vue'
import { generatePreviewableRecordField } from '~/services/recordInfo'

export const User = <RecordInfo<'user'>>{
  typename: 'user',
  pluralTypename: 'users',
  name: 'User',
  pluralName: 'Users',
  icon: 'mdi-account',
  renderItem: (item) => item.email,
  fields: {
    id: {
      text: 'ID',
    },
    name: {
      text: 'Name',
    },
    nameWithAvatar: {
      text: 'Name',
      fields: ['name', 'avatar'],
      component: NameAvatarColumn,
    },
    record: generatePreviewableRecordField({
      text: 'User',
      followLinkModel: 'userUserFollowLink',
    }),
    email: {
      text: 'Email',
    },
    avatar: {
      text: 'Avatar',
      inputType: 'avatar',
      component: AvatarColumn,
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
      parseQueryValue: (val) => val === 'true',
      inputType: 'switch',
    },
    currentUserFollowing: {
      text: 'Follow',
      fields: ['currentUserFollowLink.id'],
      component: FollowColumn,
      columnOptions: {
        linkModel: 'userUserFollowLink',
      },
    },
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
    hasSearch: true,
    publicFilterField: 'isPublic',
    filterOptions: [
      {
        field: 'role',
        operator: 'eq',
      },
    ],
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
    ],
    headerOptions: [
      {
        field: 'nameWithAvatar',
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
      'name',
      'email',
      'role',
      'permissions',
      'isPublic',
      'currentUserFollowing',
    ],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
