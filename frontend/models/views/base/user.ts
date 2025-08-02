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
import { userRoleMap } from '~/services/constants'
import { Columns } from '~/services/components'

export const BaseUserView: ViewDefinition = {
  routeType: 'base',
  routeKey: UserEntity.typename,
  entity: UserEntity,
  requiredFields: ['avatarUrl', 'name'],
  inputFields: {
    ...generateBaseInputFields(UserEntity),
    email: {},
    password: {},
    role: {
      inputType: 'select',
      getOptions: getUserRoleEnumValues,
    },
    permissions: {
      inputType: 'multiple-select',
      getOptions: getUserPermissionEnumValues,
    },
    isPublic: {
      inputType: 'switch',
      getInitialValue: () => true,
    },
    allowEmailNotifications: {
      inputType: 'switch',
      getInitialValue: () => true,
    },
  },
  renderFields: {
    ...generateBaseRenderFields(UserEntity),
    email: {},
    role: {
      component: Columns.ChipColumn,
      renderOptions: {
        smallMode: true,
        valuesMap: userRoleMap,
      },
    },
    isPublic: {
      component: Columns.BooleanColumn,
    },
    permissions: {},
    allowEmailNotifications: {
      component: Columns.BooleanColumn,
    },
    currentUserFollowing: {
      text: 'Follow',
      fields: ['currentUserFollowLink.id'],
      component: Columns.FollowColumn,
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
    filters: [
      {
        fieldKey: 'role',
        operator: 'eq',
      },
    ],
    ...generateClickRowToOpenDialogOptions(),
    sortFields: [
      ...generateSortOptions({ fieldPath: 'createdAt' }),
      ...generateSortOptions({ fieldPath: 'updatedAt' }),
    ],
    headers: [
      {
        fieldKey: 'nameWithAvatar',
        hideIfGrid: true,
      },
      {
        fieldKey: 'email',
        width: '150px',
      },
      {
        fieldKey: 'role',
        width: '150px',
      },
      {
        fieldKey: 'updatedAt',
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
  shareOptions: {},
  childTypes: [],
}
