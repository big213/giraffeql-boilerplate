import type { RecordInfo } from '~/types'
import { convertViewDefinition } from '~/services/view'
import { myViews } from '~/models2/views'

export const MyApiKey: RecordInfo<'apiKey'> = convertViewDefinition(
  myViews.ApiKey
)
