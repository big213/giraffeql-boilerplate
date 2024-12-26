import { PreviewDefinition } from '~/types/preview'
import { UserEntity, UserUserFollowLinkEntity } from '../entities'

export const UserPreview: PreviewDefinition = {
  entity: UserEntity,
  renderFields: {
    name: {},
    avatarUrl: {},
  },
  fields: ['__typename'],
  heroOptions: {},
  followOptions: {
    entity: UserUserFollowLinkEntity,
  },
}
