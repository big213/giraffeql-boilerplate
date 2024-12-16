import type { SimpleRecordInfo } from '~/types'

export const SimpleFile: SimpleRecordInfo<'file'> = {
  typename: 'file',
  name: 'File',
  pluralName: 'Files',
  icon: 'mdi-file',
  hasName: true,
  hasAvatar: false,
  hasDescription: false,
}
