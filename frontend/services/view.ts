import { FieldDefinition, RecordInfo } from '~/types'
import {
  EntityDefinition,
  InputFieldDefinition,
  InputType,
  RenderFieldDefinition,
  ViewDefinition,
} from '~/types/view'
import CopyableColumn from '~/components/table/copyableColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import RecordColumn from '~/components/table/recordColumn.vue'
import { UserEntity } from '~/models2/entities'
import {
  camelCaseToCapitalizedString,
  enterRoute,
  generateViewRecordRoute,
} from './base'

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
        record: generatePreviewableRecordField({
          text: 'Record',
          entity: entity,
        }),
      }),
    createdBy: generatePreviewableRecordField({
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

export function generatePreviewableRecordField({
  fieldname,
  text,
  entity,
  fieldOptions,
}: {
  fieldname?: string
  text?: string
  entity: EntityDefinition
  fieldOptions?: Omit<FieldDefinition, 'text'>
}) {
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
    ...fieldOptions,
  }
}

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
      desc: true,
    },
    {
      text: `${text ?? camelCaseToCapitalizedString(field)} (Asc)`,
      field,
      desc: false,
    },
  ]
}

// paginationOption helpers
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
