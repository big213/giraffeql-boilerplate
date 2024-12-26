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
  routeType: 'a',
  entity: UserUserFollowLinkEntity,
  inputFields: {
    ...generateBaseInputFields(UserUserFollowLinkEntity),
    'user.id': generateJoinableInputField({
      entity: UserEntity,
    }),
    'target.id': generateJoinableInputField({
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
    filterOptions: [],
    sortOptions: [
      ...generateSortOptions({ field: 'createdAt' }),
      ...generateSortOptions({ field: 'updatedAt' }),
    ],
    headerOptions: [
      {
        field: 'user',
      },
      {
        field: 'target',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
  },
  createOptions: {
    fields: ['user.id', 'target.id'],
  },
  updateOptions: {
    fields: ['user.id', 'target.id'],
  },
  viewOptions: {
    fields: ['user', 'target'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  childTypes: [],
}
