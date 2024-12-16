import type { RecordInfo } from '~/types'
import { convertViewDefinition } from '~/services/view'
import { baseViews } from '~/models2/views'

export const UserUserFollowLink: RecordInfo<'userUserFollowLink'> =
  convertViewDefinition(baseViews.UserUserFollowLink)
