import SimplifiedTimeStringColumn from '~/components/table/simplifiedTimeStringColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import {
  generateBaseFields,
  generateClickRowToExpandOptions,
  generateClickRowToOpenDialogOptions,
  generateCurrencyField,
  generateJoinableField,
  generateMultipleJoinableField,
  generatePreviewableFilesColumn,
  generatePreviewableJoinableField,
  generatePreviewableRecordField,
  generateSortOptions,
} from '~/services/recordInfo'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import { getUserRoleEnumValues } from '~/services/dropdown'
import ChipColumn from '~/components/table/chipColumn.vue'
import type { RecordInfo } from '~/types'

export const Event: RecordInfo<any> = {
  typename: 'event',
  routeType: 'a',
  name: 'Event',
  pluralName: 'Events',
  icon: 'mdi-calendar',
  requiredFields: ['name', 'avatarUrl', 'isActive'],
  inputFields: {},
  renderFields: {},
  paginationOptions: {
    searchOptions: {},
    filterOptions: [
      {
        field: 'createdBy',
        operator: 'eq',
      },
      {
        field: 'locale',
        operator: 'eq',
      },
      {
        field: 'isActive',
        operator: 'eq',
      },
    ],
    heroOptions: {},
    ...generateClickRowToOpenDialogOptions(),
    ...generateClickRowToExpandOptions(),
    sortOptions: [
      ...generateSortOptions({ field: 'createdAt', text: 'Created At' }),
      ...generateSortOptions({ field: 'updatedAt', text: 'Updated At' }),
    ],
    headerOptions: [
      {
        field: 'nameWithAvatarAndActive',
        hideIfGrid: true,
      },
      {
        field: 'localeRecord',
        width: '200px',
      },
      {
        field: 'participantsOverview',
        width: '50px',
        align: 'right',
      },
      {
        field: 'currentUserSignupStatus',
        width: '100px',
      },
      {
        field: 'whenTimeRange',
        width: '200px',
      },
      {
        field: 'modifiedAt',
        width: '150px',
      },
    ],
    importOptions: {
      fields: [
        {
          field: 'collectibleType',
          path: 'collectibleType.id',
        },
        {
          field: 'sortIndex',
        },
        {
          field: 'name',
        },
      ],
    },
    downloadOptions: {
      fields: [
        {
          field: 'thing.id',
        },
        {
          field: 'thing.name',
        },
        {
          field: 'quantity',
        },
      ],
    },
  },
  addOptions: {
    fields: [
      'locale',
      'avatarUrl',
      'name',
      'description',
      'files',
      'externalLinks',
      'location',
      'locationInstructions',
      'startAt',
      'endAt',
      'signupStartAt',
      'signupEndAt',
      'costPerPerson',
      'itemsCost',
      'paymentInstructions',
      'participantsLimit',
      'isPublic',
    ],
  },
  copyOptions: {
    fields: [
      'locale',
      'avatarUrl',
      'name',
      'description',
      'files',
      'externalLinks',
      'location',
      'locationInstructions',
      'costPerPerson',
      'itemsCost',
      'paymentInstructions',
      'participantsLimit',
    ],
  },
  editOptions: {
    fields: [
      'locale',
      'avatarUrl',
      'name',
      'description',
      'location',
      'locationInstructions',
      'files',
      'externalLinks',
      'postEventFiles',
      'startAt',
      'endAt',
      'signupStartAt',
      'signupEndAt',
      'costPerPerson',
      'itemsCost',
      'paymentInstructions',
      'participantsLimit',
      'isPublic',
      'isActive',
    ],
  },
  viewOptions: {
    fields: [
      'localeRecord',
      'description',
      'location',
      'locationInstructions',
      'files',
      'externalLinks',
      'postEventFiles',
      'whenTimeRange',
      'signupTimeRange',
      'costPerPerson',
      'itemsCost',
      'paymentInstructions',
      'participantsOverview',
      'confirmAttendedOverview',
      'isPublic',
      'currentUserSignupStatus',
      'hostsListHorizontal',
      'concludedAt',
    ],
    heroOptions: {},
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [
    /*
    {
      key: "tasktemplates",
      recordInfo: TaskTemplate,
      name: 'Task Templates',
      excludeHeaders: ['taskTemplateCollectionRecord'],
      lockedFilters: (_that, item) => {
        return [
          {
            field: 'taskTemplateCollection',
            operator: 'eq',
            value: item.id,
          },
        ]
      },
      initialSortOptions: {
        field: 'createdAt',
        desc: true,
      },
    },
    */
  ],
  customActions: [
    {
      text: 'Some Action',
      icon: 'mdi-information',
      // handleClick: pauseSeries,
      // handleClick: (that, item) => {},
      // showIf: (that, item) => true
      // isAsync: true,
    },
  ],
}

// actions.ts
/*
export const pauseSeries = async (that, item) => {
  try {
    await executeGiraffeql({
      updateHttpRequestSeries: {
        __args: {
          item: {
            id: item.id,
          },
          fields: {
            isPaused: true,
          },
        },
      },
    })

    that.$root.$emit('refresh-interface', 'httpRequestSeries')

    that.$notifier.showSnackbar({
      message: 'Done pausing series',
      variant: 'success',
    })
  } catch (err) {
    handleError(that, err)
  }
}
*/
