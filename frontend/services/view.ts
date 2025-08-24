import type { InputDefinition, InputType, RenderDefinition } from '~/types'
import { UserEntity } from '~/models/entities'
import {
  camelCaseToCapitalizedString,
  enterRoute,
  formatAsCurrency,
  generateDateLocaleString,
  generateTimeAgoString,
  getNestedProperty,
} from './base'
import type { EntityDefinition } from '~/types/entity'
import type { ViewDefinition } from '~/types/view'
import { generateViewRecordRoute } from './route'
import { Columns } from './components'

export function generateSortOptions({
  fieldPath,
  text,
}: {
  fieldPath: string
  text?: string
}) {
  return [
    {
      text: `${text ?? camelCaseToCapitalizedString(fieldPath)} (Desc)`,
      fieldPath,
      key: `${fieldPath}-desc`,
      desc: true,
    },
    {
      text: `${text ?? camelCaseToCapitalizedString(fieldPath)} (Asc)`,
      fieldPath,
      key: `${fieldPath}-asc`,
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
      that.openEditDialog({ mode: action, parentItem: props.item })
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog({ mode: action, parentItem: item })
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
          viewDefinition: that.viewDefinition,
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
          viewDefinition: that.viewDefinition,
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
  icon,
  columnMode = false,
  limit = 4,
  paginationOptions,
}: {
  viewDefinition: ViewDefinition
  title?: string
  icon?: string
  columnMode?: boolean
  limit?: number
  paginationOptions?: any
}): ViewDefinition {
  return {
    ...viewDefinition,
    ...(title && { title }),
    ...(icon && { icon }),
    createOptions: undefined,
    paginationOptions: {
      // dont override existing configuration for these
      defaultLockedFilters: () => [],
      defaultPageOptions: () => ({
        search: null,
        filters: [],
        sort: 'createdAt-desc',
      }),
      hideFilters: true,
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
  [x: string]: RenderDefinition
} {
  return {
    id: {
      text: 'ID',
      component: Columns.CopyableColumn,
    },
    ...(entity.nameField && {
      [entity.nameField]: {},
    }),
    // if there is a separate nameInputField, also add that one
    ...(entity.nameInputField &&
      entity.nameInputField !== entity.nameField && {
        [entity.nameInputField]: {},
      }),
    ...(entity.avatarField && {
      [entity.avatarField]: {
        component: Columns.AvatarColumn,
        text: 'Avatar',
      },
    }),
    ...(entity.descriptionField && {
      [entity.descriptionField]: {},
    }),
    ...(entity.nameField &&
      entity.avatarField && {
        nameWithAvatar: {
          text: 'Name',
          fields: [entity.nameField, entity.avatarField],
          component: Columns.NameAvatarColumn,
          pathPrefix: null,
          renderOptions: {
            nameField: entity.nameField,
            avatarUrlField: entity.avatarField,
          },
        },
        record: generateJoinableRenderField({
          text: 'Record',
          entity: entity,
        }),
      }),
    createdBy: generateJoinableRenderField({
      fieldname: 'createdBy',
      entity: UserEntity,
    }),
    createdAt: generateTimeagoRenderField(),
    updatedAt: generateTimeagoRenderField(),
  }
}

export function generateShareLinkRenderField(): RenderDefinition {
  return {
    text: 'Share Link',
    fields: ['id', '__typename'],
    component: Columns.ShareLinkColumn,
  }
}

// of N fields, where one is expected to be truthy
export function generateTruthyRecordRenderField({
  text,
  fields,
}: {
  text?: string
  fields: string[] // fieldPaths are OK
}): RenderDefinition {
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
    component: Columns.TruthyRecordColumn,
  }
}

// series of records that are supposed to appear sequentially
export function generateConcatRecordRenderField({
  text,
  fields,
}: {
  text?: string
  fields: string[] // fieldPaths are OK
}): RenderDefinition {
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
    component: Columns.ConcatRecordColumn,
  }
}

export function generateJoinableRenderField({
  fieldname,
  text,
  additionalFields,
  entity,
  renderDefinition,
}: {
  fieldname?: string
  text?: string
  additionalFields?: string[]
  entity: EntityDefinition
  renderDefinition?: RenderDefinition
}): RenderDefinition {
  // if no fieldname, assume entity.typename is fieldname
  const validatedFieldname = fieldname ?? entity.typename
  const fieldnamePrefix = validatedFieldname ? `${validatedFieldname}.` : ''
  return {
    text,
    fields: <string[]>(
      [
        `${fieldnamePrefix}id`,
        `${fieldnamePrefix}__typename`,
        entity.nameField ? `${fieldnamePrefix}${entity.nameField}` : null,
        entity.avatarField ? `${fieldnamePrefix}${entity.avatarField}` : null,
      ]
        .filter((e) => e)
        .concat(additionalFields ?? [])
    ),
    pathPrefix: validatedFieldname,
    component: Columns.RecordColumn,
    ...renderDefinition,
  }
}

export function generatePreviewableFilesRenderColumn({
  fieldname = 'files',
  text,
  hideDownload = false,
  mediaMode = false,
  useFirebaseUrl = false,
  renderDefinition,
}: {
  fieldname?: string
  text?: string
  hideDownload?: boolean
  mediaMode?: boolean
  useFirebaseUrl?: boolean
  renderDefinition?: RenderDefinition
} = {}): RenderDefinition {
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
    component: mediaMode ? Columns.PreviewableFilesColumn : Columns.FilesColumn,
    ...renderDefinition,
  }
}

// if currencySymbolFieldPath, the field must be made available (usually through requiredFields)
export function generateCurrencyRenderField(
  {
    currencySymbolFieldPath,
    currencySymbol = '$',
  }: {
    currencySymbolFieldPath?: string
    currencySymbol?: string
  } = {},
  renderDefinition: RenderDefinition = {}
): RenderDefinition {
  return {
    renderOptions: {
      getDisplayStr: (currentValue, item) =>
        currentValue === null
          ? 'N/A'
          : formatAsCurrency(
              currentValue,
              currencySymbolFieldPath
                ? getNestedProperty(item, currencySymbolFieldPath)
                : currencySymbol
            ),
    },
    component: Columns.StringColumn,
    ...renderDefinition,
  }
}

export function generatePercentRenderField(
  renderDefinition: RenderDefinition = {}
): RenderDefinition {
  return {
    ...renderDefinition,
    renderOptions: {
      getDisplayStr: (currentValue, item) =>
        currentValue === null ? 'N/A' : `${currentValue * 100}%`,
    },
    component: Columns.StringColumn,
  }
}

export function generateTimeagoRenderField(
  renderDefinition: RenderDefinition = {}
): RenderDefinition {
  return {
    ...renderDefinition,
    renderOptions: {
      getDisplayStr: (currentValue, item) =>
        generateTimeAgoString(currentValue) || 'None',
      getTitleStr: (currentValue, item) =>
        generateDateLocaleString(currentValue) || 'None',
    },
    component: Columns.StringColumn,
  }
}

export function generateSimplifiedTimeStringRenderField(
  renderDefinition: RenderDefinition = {}
): RenderDefinition {
  return {
    ...renderDefinition,
    renderOptions: {
      getDisplayStr: (currentValue, item) =>
        generateDateLocaleString(currentValue, true) ?? 'None',
      getTitleStr: (currentValue, item) =>
        generateDateLocaleString(currentValue, true) ?? 'None',
    },
    component: Columns.StringColumn,
  }
}

export function generateDateTimeRangeRenderField(
  {
    fromField,
    untilField,
  }: {
    fromField: string
    untilField: string
  },
  renderDefinition: RenderDefinition = {}
): RenderDefinition {
  return {
    fields: [fromField, untilField],
    ...renderDefinition,
    renderOptions: {
      getDisplayStr: (currentValue, item) => {
        return `${
          generateDateLocaleString(item[fromField], true) ?? 'None'
        } - ${generateDateLocaleString(item[untilField], true) ?? 'None'}`
      },
      showTitle: true,
    },
    component: Columns.StringColumn,
  }
}

export function generateDateRangeRenderField(
  {
    fromField,
    untilField,
  }: {
    fromField: string
    untilField: string
  },
  renderDefinition: RenderDefinition = {}
): RenderDefinition {
  return {
    fields: [fromField, untilField],
    ...renderDefinition,
    renderOptions: {
      getDisplayStr: (currentValue, item) => {
        return `${item[fromField] ?? 'None'} - ${item[untilField] ?? 'None'}`
      },
      showTitle: true,
    },
    component: Columns.StringColumn,
  }
}

export function generateMultipleJoinableRenderField({
  fieldname,
  text,
  entity,
  renderDefinition,
}: {
  fieldname?: string
  text?: string
  entity: EntityDefinition
  renderDefinition?: RenderDefinition
}): RenderDefinition {
  const validatedFieldname = fieldname ?? entity.typename
  return {
    text,
    fields: [
      `${validatedFieldname}`,
      `${validatedFieldname}.id`,
      `${validatedFieldname}.name`,
      `${validatedFieldname}.__typename`,
      `${validatedFieldname}.avatarUrl`,
    ],
    pathPrefix: validatedFieldname,
    component: Columns.RecordColumn,
    ...renderDefinition,
  }
}

/*
 * Input Fields
 */

export function generateBaseInputFields(entity: EntityDefinition): {
  [x: string]: InputDefinition
} {
  const nameInputField = entity.nameInputField ?? entity.nameField
  return {
    ...(nameInputField && {
      [nameInputField]: {},
    }),
    ...(entity.avatarField && {
      [entity.avatarField]: {
        text: 'Avatar',
        inputType: 'single-image-url' as InputType,
        avatarOptions: {
          fallbackIcon: entity.icon,
        },
      },
    }),
    ...(entity.descriptionField && {
      [entity.descriptionField]: {
        inputType: 'textarea' as InputType,
      },
    }),
  }
}

export function generateJoinableInputField({
  entity,
  inputType = 'type-autocomplete',
  ...remainingInputDefinition
}: {
  entity: EntityDefinition
} & InputDefinition): InputDefinition {
  return {
    entity,
    inputType,
    ...remainingInputDefinition,
  }
}

export function generateCurrencyInputField(
  inputDefinition: InputDefinition = {}
): InputDefinition {
  return {
    inputType: 'text',
    parseValue: currencyParser,
    ...inputDefinition,
  }
}

export function generateMultipleJoinableInputField({
  entity,
  inputType = 'type-autocomplete-multiple',
  ...remainingInputDefinition
}: {
  entity: EntityDefinition
  inputType?: InputType
} & InputDefinition): InputDefinition {
  return {
    inputType,
    entity,
    getInitialValue: () => [],
    parseValue: (val) => {
      // if not array, convert to empty array
      if (!Array.isArray(val)) {
        return []
      }

      // if array, extract the id field only
      return val.map((ele) => ({ id: ele.id }))
    },
    ...remainingInputDefinition,
  }
}

export function generateFilesInputColumn({
  inputType = 'multiple-file',
  limit,
  // solo mode essentially grabs the first file in the array, if any -- probably doesn't work at the moment
  soloMode = false,
  mediaMode = false,
  useFirebaseUrl = false,
  ...remainingInputDefinition
}: {
  inputType?: InputType
  limit?: number
  soloMode?: boolean
  mediaMode?: boolean
  useFirebaseUrl?: boolean
} & InputDefinition = {}): InputDefinition {
  return {
    parseValue: (val) => {
      if (!Array.isArray(val)) return soloMode ? null : []

      const mappedValues = val.map((id) => ({ id }))

      // if solo mode, get the first array element
      return soloMode ? mappedValues[0] ?? null : mappedValues
    },
    getInitialValue: () => [],
    contentType: mediaMode ? 'image/*' : undefined,
    inputType,
    useFirebaseUrl,
    limit,
    mediaMode,
    ...remainingInputDefinition,
  }
}

/*
 * Parsers
 */

export function emptyStringToNullParser(val: any) {
  return typeof val === 'string' ? (val.trim() ? val : null) : val
}

// parses "-$2.02" to -2.02
export function currencyParser(val: any) {
  if (!val) return val

  return String(val).replace(/[^(\d|.|\-)]/g, '')
}

// will parse "($2.02)" to "-2.02"
export function excelCurrencyParser(val: any) {
  return typeof val === 'string'
    ? val.replace(/[$),\s]/g, '').replace(/^\(/, '-')
    : val
}

// parses from '12/1/2024' to '2024-12-01'. if null, uses current date
export function excelDateParser(val: any) {
  return (val ? new Date(val) : new Date()).toISOString().split('T')[0]
}

export function booleanParser(val: any) {
  return val === 'TRUE'
}
