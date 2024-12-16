import { RecordInfo } from '~/types'
import { convertViewDefinition } from '~/services/view'
import { myViews } from '~/models2/views'

export const MyProfile: RecordInfo<'user'> = convertViewDefinition(
  myViews.Profile
)
