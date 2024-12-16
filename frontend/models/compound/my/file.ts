import type { RecordInfo } from '~/types'
import { convertViewDefinition } from '~/services/view'
import { myViews } from '~/models2/views'

export const MyFile: RecordInfo<'file'> = convertViewDefinition(myViews.File)
