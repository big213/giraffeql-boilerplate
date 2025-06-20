import { ViewDefinition } from '~/types/view'
import { ApiKeyEntity, UserEntity } from '~/models/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateClickRowToOpenDialogOptions,
  generateJoinableInputField,
  generatePreviewableRecordRenderField,
  generateSortOptions,
} from '~/services/view'
import { Columns } from '~/services/components'
import { getCurrentUserAllPermissions } from '~/services/dropdown'

export const BaseApiKeyView: ViewDefinition = {
  routeType: 'base',
  routeKey: ApiKeyEntity.typename,
  entity: ApiKeyEntity,
  inputFields: {
    ...generateBaseInputFields(ApiKeyEntity),
    code: {},
    permissions: {
      inputType: 'multiple-select',
      // the options are the permissions of the current user
      getOptions: getCurrentUserAllPermissions,
      getInitialValue: () => null,
    },
    user: generateJoinableInputField({
      entity: UserEntity,
    }),
  },
  renderFields: {
    ...generateBaseRenderFields(ApiKeyEntity),
    code: {
      component: Columns.CopyableColumn,
    },
    permissions: {},
    allowedPermissions: {},
    user: generatePreviewableRecordRenderField({
      entity: UserEntity,
    }),
  },
  paginationOptions: {
    searchOptions: undefined,
    filters: [],
    ...generateClickRowToOpenDialogOptions(),
    sortFields: [
      ...generateSortOptions({ fieldPath: 'createdAt' }),
      ...generateSortOptions({ fieldPath: 'updatedAt' }),
    ],
    headers: [
      {
        fieldKey: 'name',
        hideIfGrid: true,
      },
      {
        fieldKey: 'user',
        width: '200px',
      },
      {
        fieldKey: 'code',
        width: '250px',
      },
      {
        fieldKey: 'updatedAt',
        width: '150px',
      },
    ],
  },

  createOptions: {
    fields: ['name', 'permissions', 'user'],
  },
  updateOptions: {
    fields: ['name', 'permissions'],
  },
  viewOptions: {
    fields: ['name', 'permissions', 'allowedPermissions', 'code', 'user'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: undefined,

  childTypes: [],
}
