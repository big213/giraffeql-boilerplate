import {
  InputFieldDefinition,
  InputOptions,
  InputType,
  RenderFieldDefinition,
} from '~/types'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import RecordColumn from '~/components/table/recordColumn.vue'
import { UserEntity } from '~/models/entities'
import {
  camelCaseToCapitalizedString,
  enterRoute,
  generateViewRecordRoute,
} from './base'
import { EntityDefinition } from '~/types/entity'
import { ViewDefinition } from '~/types/view'
import ShareLinkColumn from '~/components/table/shareLinkColumn.vue'
import TruthyRecordColumn from '~/components/table/truthyRecordColumn.vue'
import ConcatRecordColumn from '~/components/table/concatRecordColumn.vue'
import FilesColumn from '~/components/table/filesColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import CurrencyColumn from '~/components/table/currencyColumn.vue'

export function generateSortOptions({
  field,
  text,
}: {
  field: string
  text?: string
}) {
  return [
    {
      text: `${text ?? camelCaseToCapitalizedString(field)} (Desc)`,
      field,
      key: `${field}-desc`,
      desc: true,
    },
    {
      text: `${text ?? camelCaseToCapitalizedString(field)} (Asc)`,
      field,
      key: `${field}-asc`,
      desc: false,
    },
  ]
}

/*
 * PaginationOption helpers
 */
export function generateClickRowToOpenDialogOptions(
  action: 'view' | 'update' | 'delete' | 'share' | 'copy' = 'view'
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
      } else if (that.viewDefinition.childTypes[0]) {
        that.toggleItemExpanded(props, that.viewDefinition.childTypes[0])
      }
    },
    handleGridElementClick: (that, item) => {
      if (that.viewDefinition.childTypes[0]) {
        that.toggleGridExpand(item, that.viewDefinition.childTypes[0])
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
          routeKey: that.viewDefinition.entity.typename,
          routeType: that.viewDefinition.routeType,
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
          routeKey: that.viewDefinition.entity.typename,
          routeType: that.viewDefinition.routeType,
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

// custom functions
export function generateHomePageViewDefinition({
  viewDefinition,
  title,
  columnMode = false,
  limit = 4,
  paginationOptions,
}: {
  viewDefinition: ViewDefinition
  title?: string
  columnMode?: boolean
  limit?: number
  paginationOptions?: any
}): ViewDefinition {
  return {
    ...viewDefinition,
    ...(title && { title }),
    createOptions: undefined,
    paginationOptions: {
      // dont override existing configuration for these
      defaultLockedFilters: () => [],
      defaultPageOptions: () => ({
        search: null,
        filters: [],
        sort: 'createdAt-desc',
      }),
      ...viewDefinition.paginationOptions,
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

export function generatePreviewViewDefinition({
  viewDefinition,
  title,
}: {
  viewDefinition: ViewDefinition
  title?: string
}): ViewDefinition {
  return {
    ...viewDefinition,
    ...(title && { title }),
    paginationOptions: {
      ...viewDefinition.paginationOptions!,
      defaultLockedFilters: () => [],
      defaultPageOptions: () => ({
        search: null,
        filters: [],
        sort: 'createdAt-desc',
      }),
      hideGridModeToggle: true,
      minHeight: '250px',
      loaderStyle: 'circular',
      maxInitialRecords: 4,
      limitOptions: {},
      hideRefresh: true,
    },
  }
}

/*
 * Render Field Generators
 */

export function generateBaseRenderFields(entity: EntityDefinition): {
  [x: string]: RenderFieldDefinition
} {
  return {
    id: {
      text: 'ID',
      component: CopyableColumn,
    },
    ...(entity.nameField && {
      [entity.nameField]: {},
    }),
    ...(entity.avatarField && {
      [entity.avatarField]: {
        component: AvatarColumn,
        text: 'Avatar',
        inputOptions: {
          inputType: 'single-image-url' as InputType,
          avatarOptions: {
            fallbackIcon: entity.icon,
          },
        },
      },
    }),
    ...(entity.descriptionField && {
      [entity.descriptionField]: {
        inputOptions: {
          inputType: 'textarea' as InputType,
        },
      },
    }),
    ...(entity.nameField &&
      entity.avatarField && {
        nameWithAvatar: {
          text: 'Name',
          fields: ['name', 'avatarUrl'],
          component: NameAvatarColumn,
        },
        record: generatePreviewableRecordRenderField({
          text: 'Record',
          entity: entity,
        }),
      }),
    createdBy: generatePreviewableRecordRenderField({
      fieldname: 'createdBy',
      entity: UserEntity,
    }),
    createdAt: {
      component: TimeagoColumn,
    },
    updatedAt: {
      component: TimeagoColumn,
    },
  }
}

export function generateShareLinkRenderField(): RenderFieldDefinition {
  return {
    text: 'Share Link',
    fields: ['id', '__typename'],
    component: ShareLinkColumn,
  }
}

// of N fields, where one is expected to be truthy
export function generateTruthyRecordRenderField({
  text,
  fields,
}: {
  text?: string
  fields: string[] // fieldPaths are OK
}): RenderFieldDefinition {
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
    renderOptions: {
      fields,
    },
    component: TruthyRecordColumn,
  }
}

// series of records that are supposed to appear sequentially
export function generateConcatRecordRenderField({
  text,
  fields,
}: {
  text?: string
  fields: string[] // fieldPaths are OK
}): RenderFieldDefinition {
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
    renderOptions: {
      fields,
    },
    component: ConcatRecordColumn,
  }
}

export function generatePreviewableRecordRenderField({
  fieldname,
  text,
  entity,
  renderDefinition,
}: {
  fieldname?: string
  text?: string
  entity: EntityDefinition
  renderDefinition?: RenderFieldDefinition
}): RenderFieldDefinition {
  const fieldnamePrefix = fieldname ? `${fieldname}.` : ''
  return {
    text,
    fields: <string[]>(
      [
        `${fieldnamePrefix}id`,
        `${fieldnamePrefix}__typename`,
        entity.nameField ? `${fieldnamePrefix}${entity.nameField}` : null,
        entity.avatarField ? `${fieldnamePrefix}${entity.avatarField}` : null,
      ].filter((e) => e)
    ),
    pathPrefix: fieldname,
    component: RecordColumn,
    ...renderDefinition,
  }
}

export function generatePreviewableFilesRenderColumn({
  fieldname,
  text,
  hideDownload = false,
  mediaMode = false,
  useFirebaseUrl = false,
  renderDefinition,
}: {
  fieldname: string
  text?: string
  inputType?: InputType
  limit?: number
  soloMode?: boolean
  hideDownload?: boolean
  mediaMode?: boolean
  useFirebaseUrl?: boolean
  renderDefinition?: RenderFieldDefinition
}): RenderFieldDefinition {
  return {
    text,
    fields: <string[]>(
      [
        fieldname,
        `${fieldname}.id`,
        `${fieldname}.name`,
        `${fieldname}.size`,
        `${fieldname}.contentType`,
        `${fieldname}.location`,
        `${fieldname}.servingUrl`,
        useFirebaseUrl ? `${fieldname}.downloadUrl` : null,
      ].filter((e) => e)
    ),
    pathPrefix: fieldname,
    renderOptions: {
      hideDownload,
      useFirebaseUrl,
    },
    component: mediaMode ? PreviewableFilesColumn : FilesColumn,
    ...renderDefinition,
  }
}

export function generateCurrencyRenderField({
  text,
  renderDefinition,
}: {
  text?: string
  renderDefinition?: RenderFieldDefinition
}): RenderFieldDefinition {
  return {
    text,
    component: CurrencyColumn,
    ...renderDefinition,
  }
}

export function generateMultipleJoinableRenderField({
  fieldname,
  text,
  renderDefinition,
}: {
  fieldname: string
  text?: string
  renderDefinition?: RenderFieldDefinition
}): RenderFieldDefinition {
  return {
    text,
    fields: [
      `${fieldname}`,
      `${fieldname}.id`,
      `${fieldname}.name`,
      `${fieldname}.__typename`,
      `${fieldname}.avatarUrl`,
    ],
    pathPrefix: fieldname,
    component: RecordColumn,
    ...renderDefinition,
  }
}

/*
 * Input Fields
 */

export function generateBaseInputFields(entity: EntityDefinition): {
  [x: string]: InputFieldDefinition
} {
  return {
    ...(entity.nameField && {
      [entity.nameField]: {},
    }),
    ...(entity.avatarField && {
      [entity.avatarField]: {
        text: 'Avatar',
        inputOptions: {
          inputType: 'single-image-url' as InputType,
          avatarOptions: {
            fallbackIcon: entity.icon,
          },
        },
      },
    }),
    ...(entity.descriptionField && {
      [entity.descriptionField]: {
        inputOptions: {
          inputType: 'textarea' as InputType,
        },
      },
    }),
  }
}

export function generateJoinableInputField({
  text,
  entity,
  inputType = 'type-autocomplete',
}: {
  text?: string
  entity: EntityDefinition
  inputType?: InputType
}): InputFieldDefinition {
  return {
    text,
    inputOptions: {
      inputType,
      entity,
    },
  }
}

export function generateCurrencyInputField({
  text,
  inputOptions,
}: {
  text?: string
  inputOptions?: InputOptions
}): InputFieldDefinition {
  return {
    text,
    inputOptions: {
      inputType: 'text',
      parseValue: (val) => {
        if (!val) return val

        return String(val).replace(/[^(\d|.|\-)]/g, '')
      },
      ...inputOptions,
    },
  }
}

export function generateMultipleJoinableInputField({
  text,
  entity,
  inputType = 'type-autocomplete-multiple',
  inputOptions,
}: {
  text: string
  entity: EntityDefinition
  inputType?: InputType
  inputOptions?: InputOptions
}): InputFieldDefinition {
  return {
    text,
    inputOptions: {
      getInitialValue: () => [],
      parseValue: (val) => {
        // if not array, convert to empty array
        if (!Array.isArray(val)) {
          return []
        }

        // if array, extract the id field only
        return val.map((ele) => ({ id: ele.id }))
      },
      ...inputOptions,
      inputType,
      entity,
    },
  }
}

/*
 * Parsers
 */

export function emptyStringToNullParser(val: any) {
  return typeof val === 'string' ? (val.trim() ? val : null) : val
}
