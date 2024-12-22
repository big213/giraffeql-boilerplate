import { ViewDefinition } from '~/types/view'
import { UserUserFollowLinkEntity, UserEntity } from '~/models2/entities'
import {
  generateBaseInputFields,
  generateBaseRenderFields,
  generateJoinableInputField,
  generatePreviewableRecordField,
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
    user: generatePreviewableRecordField({
      fieldname: 'user',
      entity: UserEntity,
    }),
    target: generatePreviewableRecordField({
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
