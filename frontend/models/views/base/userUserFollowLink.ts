import { ViewDefinition } from '~/types/view'
import { UserUserFollowLinkEntity, UserEntity } from '~/models/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateJoinableInputField,
  generatePreviewableRecordRenderField,
  generateSortOptions,
} from '~/services/view'

export const BaseUserUserFollowLinkView: ViewDefinition = {
  routeType: 'base',
  routeKey: UserUserFollowLinkEntity.typename,
  entity: UserUserFollowLinkEntity,
  inputFields: {
    ...generateBaseInputFields(UserUserFollowLinkEntity),
    user: generateJoinableInputField({
      entity: UserEntity,
    }),
    target: generateJoinableInputField({
      entity: UserEntity,
    }),
  },
  renderFields: {
    ...generateBaseRenderFields(UserUserFollowLinkEntity),
    user: generatePreviewableRecordRenderField({
      fieldname: 'user',
      entity: UserEntity,
    }),
    target: generatePreviewableRecordRenderField({
      fieldname: 'target',
      entity: UserEntity,
    }),
  },
  paginationOptions: {
    searchOptions: undefined,
    filters: [],
    sortFields: [
      ...generateSortOptions({ fieldPath: 'createdAt' }),
      ...generateSortOptions({ fieldPath: 'updatedAt' }),
    ],
    headers: [
      {
        fieldKey: 'user',
      },
      {
        fieldKey: 'target',
      },
      {
        fieldKey: 'updatedAt',
        width: '150px',
      },
    ],
  },
  createOptions: {
    fields: ['user', 'target'],
  },
  updateOptions: {
    fields: ['user', 'target'],
  },
  viewOptions: {
    fields: ['user', 'target'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  childTypes: [],
}
