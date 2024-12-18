import RecordColumn from '~/components/table/recordColumn.vue'
import {
  FieldDefinition,
  InputType,
  NestedOptions,
  RecordInfo,
  SimpleRecordInfo,
} from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import FilesColumn from '~/components/table/filesColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import * as SimpleModels from '../models/simple'
import { capitalizeString, enterRoute, generateViewRecordRoute } from './base'
import OwnerColumn from '~/components/table/ownerColumn.vue'
import TruthyRecordColumn from '~/components/table/truthyRecordColumn.vue'
import ConcatRecordColumn from '~/components/table/concatRecordColumn.vue'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import ShareLinkColumn from '~/components/table/shareLinkColumn.vue'
import CurrencyColumn from '~/components/table/currencyColumn.vue'

export function getSimpleModel(typename: string) {
  const model = SimpleModels[`Simple${capitalizeString(typename)}`]
  if (!model) throw new Error(`Simple model not found: ${typename}`)

  return model
}

export function generatePreviewableJoinableField({
  fieldname,
  typename,
  text,
  inputType = 'type-autocomplete',
  fieldOptions = {},
  alias,
}: {
  fieldname: string
  typename?: string
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
  fieldname,
  typename,
  text,
  fieldOptions,
}: {
  fieldname: string
  typename?: string
  text: string
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  const fieldnamePrefix = fieldname ? fieldname + '.' : ''
  const simpleModel = getSimpleModel(typename ?? fieldname)
  return {
    text,
    fields: <string[]>(
      [
        simpleModel.hasName ? `${fieldnamePrefix}name` : null,
        `${fieldnamePrefix}id`,
        `${fieldnamePrefix}__typename`,
        simpleModel.hasAvatar ? `${fieldnamePrefix}avatarUrl` : null,
      ].filter((e) => e)
    ),
    pathPrefix: fieldname,
    component: RecordColumn,
    ...fieldOptions,
  }
}

export function generateJoinableField({
  fieldname,
  typename,
  text,
  inputType = 'type-autocomplete',
  fieldOptions = {},
}: {
  fieldname: string
  typename?: string
  text: string
  inputType?: InputType
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  const simpleModel = getSimpleModel(typename ?? fieldname)
  return {
    text,
    fields: [`${fieldname}.id`],
    inputType,
    ...fieldOptions,
    inputOptions: {
      hasAvatar: simpleModel.hasAvatar,
      hasName: simpleModel.hasName,
      typename: typename ?? fieldname,
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
      avatarUrl: {
        text: 'Avatar',
        inputType: 'single-image-url' as InputType,
        component: AvatarColumn,
        inputOptions: {
          avatarOptions: {
            fallbackIcon: simpleModel.icon,
          },
        },
      },
    }),
    ...(simpleModel.hasDescription && {
      description: {
        text: 'Description',
        inputType: 'textarea' as InputType,
        tableOptions: {
          verticalView: true,
        },
      },
    }),
    ...(simpleModel.hasName &&
      simpleModel.hasAvatar && {
        nameWithAvatar: {
          text: 'Name',
          fields: ['name', 'avatarUrl'],
          component: NameAvatarColumn,
        },
        record: generatePreviewableRecordField({
          text: 'Record',
          fieldname: simpleModel.typename,
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
      inputType: 'switch' as InputType,
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
        `${fieldnamePrefix}userOwner.avatarUrl`,
        `${fieldnamePrefix}organizationOwner.id`,
        `${fieldnamePrefix}organizationOwner.name`,
        `${fieldnamePrefix}organizationOwner.__typename`,
        `${fieldnamePrefix}organizationOwner.avatarUrl`,
      ],
      pathPrefix,
      component: OwnerColumn,
    },
  }
}

export function generateShareLinkField() {
  return {
    text: 'Share Link',
    fields: ['id', '__typename'],
    component: ShareLinkColumn,
  }
}

// of N fields, where one is expected to be truthy
export function generateTruthyRecordField({
  text,
  fields,
}: {
  text: string
  fields: string[] // fieldPaths are OK
}) {
  return {
    text,
    fields: fields.reduce((total, fieldPath) => {
      return total.concat([
        `${fieldPath}.id`,
        `${fieldPath}.name`,
        `${fieldPath}.__typename`,
        `${fieldPath}.avatarUrl`,
      ])
    }, <string[]>[]),
    columnOptions: {
      fields,
    },
    component: TruthyRecordColumn,
  }
}

// series of records that are supposed to appear sequentially
export function generateConcatRecordField({
  text,
  fields,
}: {
  text: string
  fields: string[] // fieldPaths are OK
}) {
  return {
    text,
    fields: fields.reduce((total, fieldPath) => {
      return total.concat([
        `${fieldPath}.id`,
        `${fieldPath}.name`,
        `${fieldPath}.__typename`,
        `${fieldPath}.avatarUrl`,
      ])
    }, <string[]>[]),
    columnOptions: {
      fields,
    },
    component: ConcatRecordColumn,
  }
}

export function generatePreviewableFilesColumn({
  fieldname,
  text,
  inputType = 'multiple-file',
  limit,
  // solo mode essentially grabs the first file in the array, if any.
  soloMode = false,
  hideDownload = false,
  mediaMode = false,
  useFirebaseUrl = false,
  fieldOptions,
}: {
  fieldname: string
  text: string
  inputType?: InputType
  limit?: number
  soloMode?: boolean
  hideDownload?: boolean
  mediaMode?: boolean
  useFirebaseUrl?: boolean
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
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
        `${fieldname}.servingUrl`,
        useFirebaseUrl ? `${fieldname}.downloadUrl` : null,
      ].filter((e) => e),
      pathPrefix: fieldname,
      inputType,
      default: () => [],
      parseValue: (val) => {
        if (!Array.isArray(val)) return []

        const mappedValues = val.map((id) => ({ id }))

        // if solo mode, get the first array element
        return soloMode ? mappedValues[0] ?? null : mappedValues
      },
      serialize: (val) => {
        // if solo mode, need to convert to array
        return soloMode ? [val].filter((e) => e) : val
      },
      columnOptions: {
        hideDownload,
        useFirebaseUrl,
      },
      component: mediaMode ? PreviewableFilesColumn : FilesColumn,
      ...fieldOptions,
      inputOptions: {
        ...fieldOptions?.inputOptions,
        useFirebaseUrl,
        limit,
        mediaMode,
        contentType: mediaMode ? 'image/*' : null,
      },
      tableOptions: {
        ...fieldOptions?.tableOptions,
        verticalView: true,
      },
    },
  }
}

// paginationOption helpers
export function generateClickRowToOpenDialogOptions(
  action: 'view' | 'edit' | 'delete' | 'share' | 'copy' = 'view'
) {
  return {
    handleRowClick: (that, props) => {
      that.openEditDialog(action, props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog(action, item)
    },
  }
}

export function generateClickRowToExpandOptions() {
  return {
    handleRowClick: (that, props) => {
      // if already expanded, close it
      if (props.isExpanded) {
        that.closeExpandedItems()
      } else if (that.recordInfo.expandTypes[0]) {
        that.toggleItemExpanded(props, that.recordInfo.expandTypes[0])
      }
    },
    handleGridElementClick: (that, item) => {
      if (that.recordInfo.expandTypes[0]) {
        that.toggleGridExpand(item, that.recordInfo.expandTypes[0])
      }
    },
  }
}

export function generateClickRowToEnterOptions({
  expandKey,
  miniMode,
  queryParams,
}: { expandKey?: string | null; miniMode?: boolean; queryParams?: any } = {}) {
  return {
    handleRowClick: (that, props) => {
      enterRoute(
        that,
        generateViewRecordRoute(that, {
          routeKey: that.recordInfo.typename,
          routeType: that.recordInfo.routeType,
          id: props.item.id,
          showComments: true,
          miniMode,
          expandKey,
          queryParams,
        }),
        false
      )
    },
    handleGridElementClick: (that, item) => {
      enterRoute(
        that,
        generateViewRecordRoute(that, {
          routeKey: that.recordInfo.typename,
          routeType: that.recordInfo.routeType,
          id: item.id,
          showComments: true,
          miniMode,
          expandKey,
          queryParams,
        }),
        false
      )
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
        nestedOptions: {
          fields: [
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

export function generateSimpleValueArrayField({
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
        nestedOptions: {
          fields: [
            {
              key: 'value',
              inputType: 'text',
              text: 'Value',
            },
          ],
        },
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

export function generateValueArrayField({
  fieldname,
  text,
  nestedOptions,
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  nestedOptions: NestedOptions
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    text,
    inputType: 'value-array' as InputType,
    fields: [fieldname].concat(
      nestedOptions.fields.map(
        (nestedField) => `${fieldname}.${nestedField.key}`
      )
    ),
    ...fieldOptions,
    inputOptions: {
      ...fieldOptions.inputOptions,
      nestedOptions,
    },
  }
}

export function generateCurrencyField({
  text,
  fieldOptions = {},
}: {
  text: string
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    text,
    component: CurrencyColumn,
    parseValue: (val) => {
      if (!val) return val

      return String(val).replace(/[^(\d|.|\-)]/g, '')
    },
    ...fieldOptions,
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
export function generateHomePageRecordInfo({
  recordInfo,
  title,
  columnMode = false,
  limit = 4,
  paginationOptions,
}: {
  recordInfo: RecordInfo<any>
  title?: string
  columnMode?: boolean
  limit?: number
  paginationOptions?: any
}) {
  return {
    ...recordInfo,
    ...(title && { title }),
    addOptions: undefined,
    paginationOptions: {
      // dont override existing configuration for these
      defaultLockedFilters: () => [],
      defaultPageOptions: () => ({
        search: null,
        filters: [],
        sort: {
          field: 'createdAt',
          desc: true,
        },
      }),
      ...recordInfo.paginationOptions,
      // override existing configuration for these
      searchOptions: undefined,
      hideGridModeToggle: true,
      hideSortOptions: true,
      minHeight: '250px',
      loaderStyle: 'circular',
      limitOptions: {
        maxInitialRecords: limit,
      },
      hideViewMoreOptions: {},
      hideCount: true,
      showViewAll: true,
      hideRefresh: true,
      overrideViewMode: 'grid',
      ...(columnMode && {
        gridOptions: {
          justify: 'center',
          colsObject: {
            sm: 6,
          },
        },
      }),
      ...paginationOptions,
    },
  }
}

export function generatePreviewRecordInfo({
  recordInfo,
  title,
}: {
  recordInfo: RecordInfo<any>
  title?: string
}) {
  return {
    ...recordInfo,
    ...(title && { title }),
    paginationOptions: {
      ...recordInfo.paginationOptions,
      defaultLockedFilters: () => [],
      defaultPageOptions: () => ({
        search: null,
        filters: [],
        sort: {
          field: 'createdAt',
          desc: true,
        },
      }),
      hideGridModeToggle: true,
      minHeight: '250px',
      loaderStyle: 'circular',
      limitOptions: {
        maxInitialRecords: 4,
      },
      hideRefresh: true,
    },
  }
}

export function generateMultipleJoinableField({
  fieldname,
  text,
  typename,
  inputType = 'type-autocomplete-multiple',
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  typename: string
  inputType?: InputType
  fieldOptions?: Omit<FieldDefinition, 'inputType' | 'text'>
}) {
  return {
    text,
    fields: [
      `${fieldname}`,
      `${fieldname}.id`,
      `${fieldname}.name`,
      `${fieldname}.__typename`,
      `${fieldname}.avatarUrl`,
    ],
    inputType,
    default: () => [],
    parseValue: (val) => {
      // if not array, convert to empty array
      if (!Array.isArray(val)) {
        return []
      }

      // if array, extract the id field only
      return val.map((ele) => ({ id: ele.id }))
    },
    pathPrefix: fieldname,
    component: RecordColumn,
    ...fieldOptions,
    inputOptions: {
      hasAvatar: true,
      hasName: true,
      typename,
      ...fieldOptions.inputOptions,
    },
  }
}

export function emptyStringToNullParser(val: any) {
  return typeof val === 'string' ? (val.trim() ? val : null) : val
}
