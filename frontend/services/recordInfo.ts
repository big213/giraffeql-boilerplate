import RecordColumn from '~/components/table/recordColumn.vue'
import { FieldDefinition, InputType, SimpleRecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import * as SimpleModels from '../models/simple'
import { capitalizeString } from './base'
import OwnerColumn from '~/components/table/ownerColumn.vue'
import CopyableColumn from '~/components/table/copyableColumn.vue'

export function getSimpleModel(typename: string) {
  const model = SimpleModels[`Simple${capitalizeString(typename)}`]
  if (!model) throw new Error(`Simple model not found: ${typename}`)

  return model
}

export function generatePreviewableJoinableField({
  fieldname,
  typename,
  text,
  inputType = 'server-autocomplete',
  fieldOptions = {},
  alias,
}: {
  fieldname: string
  typename: string
  text: string
  inputType?: InputType
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
  alias?: string
}) {
  return {
    [alias ?? fieldname]: generateJoinableField({
      fieldname,
      typename,
      text,
      inputType,
      fieldOptions,
    }),
    [`${fieldname}Record`]: generatePreviewableRecordField({
      fieldname,
      typename,
      text,
      fieldOptions,
    }),
  }
}

export function generatePreviewableRecordField({
  typename,
  fieldname,
  text,
  fieldOptions,
}: {
  typename: string
  fieldname?: string
  text: string
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  const fieldnamePrefix = fieldname ? fieldname + '.' : ''
  const simpleModel = getSimpleModel(typename)
  return {
    text,
    fields: [
      simpleModel.hasName ? `${fieldnamePrefix}name` : null,
      `${fieldnamePrefix}id`,
      `${fieldnamePrefix}__typename`,
      simpleModel.hasAvatar ? `${fieldnamePrefix}avatar` : null,
    ].filter((e) => e),
    pathPrefix: fieldname,
    component: RecordColumn,
    ...fieldOptions,
  }
}

export function generateJoinableField({
  fieldname,
  typename,
  text,
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
  const simpleModel = getSimpleModel(typename)
  return {
    text,
    fields: [`${fieldname}.id`],
    inputType,
    ...fieldOptions,
    inputOptions: {
      hasAvatar: simpleModel.hasAvatar,
      typename,
      ...fieldOptions.inputOptions,
    },
  }
}

export function generateBaseFields(simpleModel: SimpleRecordInfo<any>) {
  return {
    id: {
      text: 'ID',
      component: CopyableColumn,
    },
    ...(simpleModel.hasName && {
      name: {
        text: 'Name',
        tableOptions: {
          verticalView: true,
        },
      },
    }),
    ...(simpleModel.hasAvatar && {
      avatar: {
        text: 'Avatar',
        inputType: 'avatar',
        component: AvatarColumn,
      },
    }),
    ...(simpleModel.hasDescription && {
      description: {
        text: 'Description',
        inputType: 'textarea',
        tableOptions: {
          verticalView: true,
        },
      },
    }),
    ...(simpleModel.hasName &&
      simpleModel.hasAvatar && {
        nameWithAvatar: {
          text: 'Name',
          fields: ['name', 'avatar'],
          component: NameAvatarColumn,
        },
        record: generatePreviewableRecordField({
          text: 'Record',
          typename: simpleModel.typename,
        }),
      }),
    ...generatePreviewableJoinableField({
      text: 'Created By',
      fieldname: 'createdBy',
      typename: 'user',
    }),
    ...(simpleModel.hasOrganizationOwner &&
      generatePreviewableJoinableField({
        text: 'Organization Owner',
        fieldname: 'organizationOwner',
        typename: 'organization',
      })),
    ...(simpleModel.hasUserOwner &&
      generatePreviewableJoinableField({
        text: 'User Owner',
        fieldname: 'userOwner',
        typename: 'user',
      })),
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
  }
}

export function generateBaseLinkFields(simpleModel: SimpleRecordInfo<any>) {
  return {
    id: {
      text: 'ID',
    },
    ...generatePreviewableJoinableField({
      text: 'CreatedBy',
      fieldname: 'createdBy',
      typename: 'user',
    }),
    ...(simpleModel.hasOrganizationOwner &&
      generatePreviewableJoinableField({
        text: 'Organization Owner',
        fieldname: 'organizationOwner',
        typename: 'organization',
      })),
    ...(simpleModel.hasUserOwner &&
      generatePreviewableJoinableField({
        text: 'User Owner',
        fieldname: 'userOwner',
        typename: 'user',
      })),
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
  }
}

export function generateIsPublicField({
  defaultValue = true,
}: {
  defaultValue?: boolean
} = {}) {
  return {
    isPublic: {
      text: 'Is Public',
      component: BooleanColumn,
      inputType: 'switch',
      default: () => defaultValue,
    },
  }
}

export function generateDualOwnerPreviewableRecordField({
  pathPrefix,
}: {
  pathPrefix?: string
} = {}) {
  const fieldnamePrefix = pathPrefix ? pathPrefix + '.' : ''
  return {
    [`${fieldnamePrefix}ownerRecord`]: {
      text: 'Owner',
      fields: [
        `${fieldnamePrefix}userOwner.id`,
        `${fieldnamePrefix}userOwner.name`,
        `${fieldnamePrefix}userOwner.__typename`,
        `${fieldnamePrefix}userOwner.avatar`,
        `${fieldnamePrefix}organizationOwner.id`,
        `${fieldnamePrefix}organizationOwner.name`,
        `${fieldnamePrefix}organizationOwner.__typename`,
        `${fieldnamePrefix}organizationOwner.avatar`,
      ],
      pathPrefix,
      component: OwnerColumn,
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
    [fieldname]: {
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
    },
  }
}

// paginationOption helpers
export function generateClickRowToOpenOptions() {
  return {
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog('view', item)
    },
  }
}

export function generateKeyValueArrayField({
  fieldname,
  text,
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    [fieldname]: {
      text,
      fields: [`${fieldname}`, `${fieldname}.key`, `${fieldname}.value`],
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'key',
            inputType: 'text',
            text: 'Key',
            inputOptions: {
              cols: 6,
            },
          },
          {
            key: 'value',
            inputType: 'text',
            text: 'Value',
            inputOptions: {
              cols: 6,
            },
          },
        ],
      },
      // filter out empty keys
      parseValue: (val) => {
        if (!Array.isArray(val)) throw new Error('Array expected')

        return val.filter((ele) => ele.key)
      },
      ...fieldOptions,
    },
  }
}

export function generateValueArrayField({
  fieldname,
  text,
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    [fieldname]: {
      text,
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'value',
            inputType: 'text',
            text: 'Value',
          },
        ],
      },
      parseValue: (val) => {
        if (!Array.isArray(val)) return []

        return val.map((ele) => ele.value)
      },
      serialize: (val) => {
        return val.map((ele) => ({ value: ele }))
      },
      ...fieldOptions,
    },
  }
}

export function generateDualOwnerInputOptions({
  hasOrganizationOwner = true,
  allowPublic = false,
}: {
  hasOrganizationOwner?: boolean
  allowPublic?: boolean
} = {}) {
  return {
    lookupParams: (that, _inputObjectArray) => {
      return {
        filterBy: [
          that.$store.getters['organizationUserMemberLink/current'] &&
          hasOrganizationOwner
            ? {
                'organizationOwner.id': {
                  eq: that.$store.getters['organizationUserMemberLink/current']
                    .organization.id,
                },
              }
            : null,
          {
            'userOwner.id': {
              eq: that.$store.getters['auth/user'].id,
            },
          },
          allowPublic
            ? {
                isPublic: {
                  eq: true,
                },
              }
            : null,
        ].filter((e) => e),
      }
    },
  }
}

export function generateSortOptions(field: string) {
  return [
    {
      field,
      desc: true,
    },
    {
      field,
      desc: false,
    },
  ]
}

// custom functions
export function generateThingSkuLookupSearchOptions(prefix?: string) {
  return {
    getParams: (that, _searchQuery) => {
      const dictionaryIds = [
        that.$store.getters['dictionary/current']?.id,
        that.$store.getters['dictionary/foreign']?.id,
      ].filter((e) => e)

      // generate the params
      return dictionaryIds.length
        ? {
            [`${prefix ? `${prefix}.` : ''}dictionaryItem.dictionary.id_in`]:
              dictionaryIds,
          }
        : undefined
    },
  }
}
