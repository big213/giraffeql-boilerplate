import RecordColumn from '~/components/table/recordColumn.vue'
import { FieldDefinition, InputType } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import ModifiedAtColumn from '~/components/table/modifiedAtColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'

export function generatePreviewableJoinableField({
  fieldname,
  typename,
  text,
  hasAvatar = false,
  inputType = 'server-autocomplete',
  fieldOptions = {},
}: {
  fieldname: string
  typename: string
  text: string
  hasAvatar?: boolean
  inputType?: InputType
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    [fieldname]: generateJoinableField({
      fieldname,
      typename,
      text,
      hasAvatar,
      inputType,
      fieldOptions,
    }),
    [`${fieldname}Record`]: generatePreviewableRecordField({
      fieldname,
      text,
      hasAvatar,
    }),
  }
}

export function generatePreviewableRecordField({
  fieldname,
  text,
  hasAvatar = false,
}: {
  fieldname?: string
  text: string
  hasAvatar?: boolean
}) {
  const fieldnamePrefix = fieldname ? fieldname + '.' : ''
  return {
    text,
    fields: [
      `${fieldnamePrefix}name`,
      `${fieldnamePrefix}id`,
      `${fieldnamePrefix}__typename`,
      hasAvatar ? `${fieldnamePrefix}avatar` : null,
    ].filter((e) => e),
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
  fieldOptions = {},
}: {
  fieldname: string
  typename: string
  text: string
  hasAvatar: boolean
  inputType?: InputType
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    text,
    fields: [`${fieldname}.id`],
    inputType,
    inputOptions: {
      hasAvatar,
      typename,
    },
    ...fieldOptions,
  }
}

export function generateBaseFields({
  hasName = false,
  hasAvatar = false,
  hasDescription = false,
}: {
  hasName?: boolean
  hasAvatar?: boolean
  hasDescription?: boolean
}) {
  return {
    id: {
      text: 'ID',
    },
    ...(hasName && {
      name: {
        text: 'Name',
        tableOptions: {
          verticalView: true,
        },
      },
    }),
    ...(hasAvatar && {
      avatar: {
        text: 'Avatar',
        inputType: 'avatar',
        component: AvatarColumn,
      },
    }),
    ...(hasDescription && {
      description: {
        text: 'Description',
        inputType: 'textarea',
        tableOptions: {
          verticalView: true,
        },
      },
    }),
    ...(hasName &&
      hasAvatar && {
        nameWithAvatar: {
          text: 'Name',
          fields: ['name', 'avatar'],
          component: NameAvatarColumn,
        },
        record: generatePreviewableRecordField({
          text: 'Record',
        }),
      }),
    createdBy: generateJoinableField({
      text: 'Created By',
      fieldname: 'createdBy',
      typename: 'user',
      hasAvatar: true,
    }),
    createdByRecord: generatePreviewableRecordField({
      fieldname: 'createdBy',
      text: 'Created By',
    }),
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
    modifiedAt: {
      fields: ['updatedAt', 'createdAt'],
      text: 'Modified At',
      component: ModifiedAtColumn,
    },
  }
}

export function generateBaseLinkFields() {
  return {
    id: {
      text: 'ID',
    },
    createdBy: generateJoinableField({
      text: 'Created By',
      fieldname: 'createdBy',
      typename: 'user',
      hasAvatar: true,
    }),
    createdByRecord: generatePreviewableRecordField({
      fieldname: 'createdBy',
      text: 'Created By',
    }),
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
    modifiedAt: {
      fields: ['updatedAt', 'createdAt'],
      text: 'Modified At',
      component: ModifiedAtColumn,
    },
  }
}

export function generatePreviewableFilesColumn({
  fieldname,
  text,
  inputType = 'multiple-media',
}: {
  fieldname: string
  text: string
  inputType?: InputType
}) {
  return {
    text,
    fields: [
      fieldname,
      `${fieldname}.id`,
      `${fieldname}.name`,
      `${fieldname}.size`,
      `${fieldname}.contentType`,
      `${fieldname}.location`,
    ],
    pathPrefix: fieldname,
    inputType,
    default: () => [],
    parseValue: (val) => {
      if (!Array.isArray(val)) return []

      return val.map((id) => ({ id }))
    },
    component: PreviewableFilesColumn,
  }
}
