import { PreviewDefinition } from '~/types/preview'
import { UserEntity, UserUserFollowLinkEntity } from '../entities'

export const UserPreview: PreviewDefinition = {
  entity: UserEntity,
  fields: [
    {
      fieldKey: '__typename',
      renderDefinition: {
        text: 'Type',
      },
    },
  ],
  heroOptions: {},
  followOptions: {
    entity: UserUserFollowLinkEntity,
  },
}
