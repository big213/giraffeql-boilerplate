import type { RecordInfo } from '~/types'
import { baseViews } from '~/models2/views'
import { convertViewDefinition } from '~/services/view'

export const ApiKey: RecordInfo<'apiKey'> = convertViewDefinition(
  baseViews.ApiKey
)
