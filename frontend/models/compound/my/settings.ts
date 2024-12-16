import type { RecordInfo } from '~/types'
import { User } from '../../base'
import { convertViewDefinition } from '~/services/view'
import { myViews } from '~/models2/views'

export const MySettings: RecordInfo<'user'> = convertViewDefinition(
  myViews.Settings
)
