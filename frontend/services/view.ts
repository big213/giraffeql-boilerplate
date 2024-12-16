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
import { camelCaseToCapitalizedString } from './base'

export function generateBaseRenderFields(entityDefinition: EntityDefinition): {
  [x: string]: RenderFieldDefinition
} {
  return {
    id: {
      text: 'ID',
      component: CopyableColumn,
    },
    ...(entityDefinition.nameField && {
      [entityDefinition.nameField]: {},
    }),
    ...(entityDefinition.avatarField && {
      [entityDefinition.avatarField]: {
        component: AvatarColumn,
        text: 'Avatar',
        inputOptions: {
          inputType: 'single-image-url' as InputType,
          avatarOptions: {
            fallbackIcon: entityDefinition.icon,
          },
        },
      },
    }),
    ...(entityDefinition.descriptionField && {
      [entityDefinition.descriptionField]: {
        inputOptions: {
          inputType: 'textarea' as InputType,
        },
      },
    }),
    ...(entityDefinition.nameField &&
      entityDefinition.avatarField && {
        nameWithAvatar: {
          text: 'Name',
          fields: ['name', 'avatarUrl'],
          component: NameAvatarColumn,
        },
        record: generatePreviewableRecordField({
          text: 'Record',
          entityDefinition: entityDefinition,
        }),
      }),
    createdBy: generatePreviewableRecordField({
      fieldname: 'createdBy',
      entityDefinition: UserEntity,
    }),
    createdAt: {
      component: TimeagoColumn,
    },
    updatedAt: {
      component: TimeagoColumn,
    },
  }
}

export function generateBaseInputFields(entityDefinition: EntityDefinition): {
  [x: string]: InputFieldDefinition
} {
  return {
    ...(entityDefinition.nameField && {
      [entityDefinition.nameField]: {},
    }),
    ...(entityDefinition.avatarField && {
      [entityDefinition.avatarField]: {
        text: 'Avatar',
        inputOptions: {
          inputType: 'single-image-url' as InputType,
          avatarOptions: {
            fallbackIcon: entityDefinition.icon,
          },
        },
      },
    }),
    ...(entityDefinition.descriptionField && {
      [entityDefinition.descriptionField]: {
        inputOptions: {
          inputType: 'textarea' as InputType,
        },
      },
    }),
  }
}

export function generateJoinableInputField({
  text,
  entityDefinition,
  inputType = 'type-autocomplete',
}: {
  text?: string
  entityDefinition: EntityDefinition
  inputType?: InputType
}): InputFieldDefinition {
  return {
    text,
    inputOptions: {
      inputType,
      hasAvatar: !!entityDefinition.avatarField,
      hasName: !!entityDefinition.nameField,
      typename: entityDefinition.typename,
    },
  }
}

export function generatePreviewableRecordField({
  fieldname,
  text,
  entityDefinition,
  fieldOptions,
}: {
  fieldname?: string
  text?: string
  entityDefinition: EntityDefinition
  fieldOptions?: Omit<FieldDefinition, 'text'>
}) {
  const fieldnamePrefix = fieldname ? `${fieldname}.` : ''
  return {
    text,
    fields: <string[]>(
      [
        `${fieldnamePrefix}id`,
        `${fieldnamePrefix}__typename`,
        entityDefinition.nameField
          ? `${fieldnamePrefix}${entityDefinition.nameField}`
          : null,
        entityDefinition.avatarField
          ? `${fieldnamePrefix}${entityDefinition.avatarField}`
          : null,
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

export function convertViewDefinition(
  viewDefinition: ViewDefinition
): RecordInfo<any> {
  return {
    ...viewDefinition.entityDefinition,
    hasName: !!viewDefinition.entityDefinition.nameField,
    hasAvatar: !!viewDefinition.entityDefinition.avatarField,
    hasDescription: !!viewDefinition.entityDefinition.descriptionField,
    routeType: viewDefinition.routeType,
    title: viewDefinition.title,
    requiredFields: viewDefinition.requiredFields,
    inputFields: viewDefinition.inputFields,
    renderFields: viewDefinition.renderFields,
    pageOptions: viewDefinition.pageOptions,
    paginationOptions: viewDefinition.paginationOptions,
    dialogOptions: viewDefinition.dialogOptions,
    addOptions: viewDefinition.createOptions,
    editOptions: viewDefinition.updateOptions,
    deleteOptions: viewDefinition.deleteOptions,
    viewOptions: viewDefinition.viewOptions,
    previewOptions: viewDefinition.previewOptions,
    chipOptions: viewDefinition.chipOptions,
    postOptions: viewDefinition.postOptions,
    copyOptions: viewDefinition.copyOptions,
    shareOptions: viewDefinition.shareOptions,
    enterOptions: viewDefinition.enterOptions,
    customActions: viewDefinition.actions,
    expandTypes: viewDefinition.childTypes ?? [],
  }
}
