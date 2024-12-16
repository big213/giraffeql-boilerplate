import type { RecordInfo } from '~/types'
import { convertViewDefinition } from '~/services/view'
import { baseViews } from '~/models2/views'

export const File: RecordInfo<'file'> = convertViewDefinition(baseViews.File)
