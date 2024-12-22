import { ViewDefinition } from '~/types/view'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import { ApiKeyEntity, UserEntity } from '~/models2/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateJoinableInputField,
  generatePreviewableRecordField,
  generateSortOptions,
} from '~/services/view'
import { getUserPermissionEnumValues } from '~/services/dropdown'

export const BaseApiKeyView: ViewDefinition = {
  routeType: 'a',
  entity: ApiKeyEntity,
  inputFields: {
    ...generateBaseInputFields(ApiKeyEntity),
    code: {
      text: 'Code',
    },
    permissions: {
      text: 'Permissions',
      inputOptions: {
        inputType: 'multiple-select',
        getOptions: getUserPermissionEnumValues,
      },
    },
    'user.id': generateJoinableInputField({
      entity: UserEntity,
    }),
  },
  renderFields: {
    ...generateBaseRenderFields(ApiKeyEntity),
    code: {
      text: 'Code',
      component: CopyableColumn,
    },
    permissions: {},
    user: generatePreviewableRecordField({
      fieldname: 'user',
      entity: UserEntity,
    }),
  },
  paginationOptions: {
    searchOptions: undefined,
    filterOptions: [],
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog('view', item)
    },
    sortOptions: [
      ...generateSortOptions({ field: 'createdAt' }),
      ...generateSortOptions({ field: 'updatedAt' }),
    ],
    headerOptions: [
      {
        field: 'name',
        hideIfGrid: true,
      },
      {
        field: 'code',
        width: '250px',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
  },

  createOptions: {
    fields: ['name', 'permissions', 'user.id'],
  },
  updateOptions: {
    fields: ['name', 'permissions'],
  },
  viewOptions: {
    fields: ['name', 'permissions', 'code', 'user'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: undefined,

  childTypes: [],
}
