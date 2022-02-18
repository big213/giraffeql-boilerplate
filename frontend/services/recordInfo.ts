import RecordColumn from '~/components/table/recordColumn.vue'
import { InputType } from '~/types'

export function generatePreviewableRecordField({
  fieldname,
  text,
}: {
  fieldname: string
  text: string
}) {
  return {
    text,
    fields: [
      `${fieldname}.name`,
      `${fieldname}.id`,
      `${fieldname}.__typename`,
      `${fieldname}.avatar`,
    ],
    pathPrefix: fieldname,
    component: RecordColumn,
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
