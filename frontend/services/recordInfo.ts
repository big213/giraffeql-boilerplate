import RecordColumn from '~/components/table/recordColumn.vue'
import { InputType } from '~/types'

export function generatePreviewableRecordField({
  fieldname,
  text,
  followLinkModel,
  showDescription = false,
}: {
  fieldname?: string
  text: string
  followLinkModel?: string
  showDescription?: boolean
}) {
  const fieldnamePrefix = fieldname ? fieldname + '.' : ''
  return {
    text,
    fields: [
      `${fieldnamePrefix}name`,
      `${fieldnamePrefix}id`,
      `${fieldnamePrefix}__typename`,
      `${fieldnamePrefix}avatar`,
    ],
    pathPrefix: fieldname,
    component: RecordColumn,
    ...(followLinkModel && {
      columnOptions: {
        linkModel: followLinkModel,
        showDescription,
      },
    }),
  }
}

export function generateJoinableField({
  fieldname,
  typename,
  text,
  hasAvatar,
  inputType = 'server-autocomplete',
}: {
  fieldname: string
  typename: string
  text: string
  hasAvatar: boolean
  inputType?: InputType
}) {
  return {
    text,
    fields: [`${fieldname}.id`],
    inputType,
    inputOptions: {
      hasAvatar,
      typename,
    },
  }
}
