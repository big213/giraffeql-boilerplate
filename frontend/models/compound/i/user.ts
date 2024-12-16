import type { RecordInfo } from '~/types'
import { User } from '~/models/base'
import { convertViewDefinition } from '~/services/view'
import { publicViews } from '~/models2/views'

export const PublicUser: RecordInfo<'user'> = convertViewDefinition(
  publicViews.User
)
