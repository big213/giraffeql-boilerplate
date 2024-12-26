import { ViewDefinition } from '~/types/view'
import { UserEntity, UserUserFollowLinkEntity } from '~/models/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateClickRowToOpenDialogOptions,
  generateSortOptions,
} from '~/services/view'
import {
  getUserPermissionEnumValues,
  getUserRoleEnumValues,
} from '~/services/dropdown'
import ChipColumn from '~/components/table/chipColumn.vue'
import { userRoleMap } from '~/services/constants'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import FollowColumn from '~/components/table/followColumn.vue'

export const BaseUserView: ViewDefinition = {
  routeType: 'a',
  entity: UserEntity,

  requiredFields: ['avatarUrl', 'name'],
  inputFields: {
    ...generateBaseInputFields(UserEntity),
    email: {},
    password: {},
    role: {
      inputOptions: {
        inputType: 'select',
        getOptions: getUserRoleEnumValues,
      },
    },
    permissions: {
      inputOptions: {
        inputType: 'multiple-select',
        getOptions: getUserPermissionEnumValues,
      },
    },
    isPublic: {
      inputOptions: {
        inputType: 'switch',
        getInitialValue: () => true,
      },
    },
    allowEmailNotifications: {
      text: 'Allow Email Notifications',
      inputOptions: {
        inputType: 'switch',
        getInitialValue: () => true,
      },
    },
  },
  renderFields: {
    ...generateBaseRenderFields(UserEntity),
    email: {},
    role: {
      component: ChipColumn,
      renderOptions: {
        smallMode: true,
        valuesMap: userRoleMap,
      },
    },
    isPublic: {
      component: BooleanColumn,
    },
    permissions: {},
    allowEmailNotifications: {
      component: BooleanColumn,
    },
    currentUserFollowing: {
      text: 'Follow',
      fields: ['currentUserFollowLink.id'],
      component: FollowColumn,
      renderOptions: {
        followOptions: {
          entity: UserUserFollowLinkEntity,
        },
      },
    },
  },
  paginationOptions: {
    searchOptions: {},
    heroOptions: {},
    filterOptions: [
      {
        field: 'role',
        operator: 'eq',
        inputOptions: {
          inputType: 'select',
          getOptions: getUserRoleEnumValues,
          clearable: true,
        },
      },
    ],
    ...generateClickRowToOpenDialogOptions(),
    sortOptions: [
      ...generateSortOptions({ field: 'createdAt' }),
      ...generateSortOptions({ field: 'updatedAt' }),
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

  createOptions: {
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
  updateOptions: {
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
  shareOptions: undefined,
  childTypes: [],
}
