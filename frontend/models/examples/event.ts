import SimplifiedTimeStringColumn from '~/components/table/simplifiedTimeStringColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import {
  generateBaseFields,
  generateClickRowToExpandOptions,
  generateClickRowToOpenDialogOptions,
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

export const Event = {
  typename: 'event',
  pluralTypename: 'events',
  name: 'Event',
  pluralName: 'Events',
  icon: 'mdi-calendar',
  requiredFields: ['name', 'avatarUrl', 'isActive'],
  fields: {
    ...generateBaseFields({
      hasName: true,
      hasAvatar: true,
      hasDescription: true,
    }),
    dateTimePickerField: {
      text: 'Start At',
      inputType: 'datetimepicker',
      component: SimplifiedTimeStringColumn,
      hint: 'Specify the time as it would appear in the local timezone',
      inputOptions: {
        cols: 6,
      },
    },
    postedDate: {
      text: 'Posted Date',
      inputType: 'datepicker',
      default: () => new Date().toISOString().split('T')[0],
    },
    standardTextField: {
      text: 'Title',
    },
    isPublic: {
      text: 'Is Public',
      component: BooleanColumn,
      inputType: 'switch',
      default: () => true,
    },
    // joinable fields
    locale: {
      ...generateJoinableField({
        text: 'Locale',
        fieldname: 'locale',
        fieldOptions: {
          // getOptions: getLocales
          /*
          getOptions: (that) =>
            getEvents(that, false, {
              sortBy: [
                {
                  field: 'sortIndex',
                  desc: false,
                },
              ],
            }),
          */
        },
      }),
    },
    localeRecord: generatePreviewableRecordField({
      fieldname: 'locale',
      text: 'Locale',
    }),
    // OR, joinable and previewable fields, combined
    ...generatePreviewableJoinableField({
      text: 'Locale',
      fieldname: 'locale',
      // inputType: 'autocomplete',
      // fieldOptions: { getOptions: getLocales },
    }),
    endedAt: {
      text: 'Ended At',
      component: TimeagoColumn,
    },
    // ONE file only (single file joined field)
    ...generatePreviewableFilesColumn({
      fieldname: 'file',
      text: 'File',
      inputType: 'multiple-file',
      soloMode: true,
      limit: 1,
    }),
    // multiple files (media mode)
    ...generatePreviewableFilesColumn({
      fieldname: 'files',
      text: 'Files',
      inputType: 'multiple-file',
      hideDownload: true,
      mediaMode: true,
    }),
    // multiple files (file chip mode)
    ...generatePreviewableFilesColumn({
      fieldname: 'files',
      text: 'Files',
      inputType: 'multiple-file',
    }),
    role: {
      text: 'User Role',
      getOptions: getUserRoleEnumValues,
      inputType: 'select',
    },
    permissions: {
      text: 'Custom Permissions',
      serialize: (val: string[]) => val && val.join(','),
      parseValue: (val: string) =>
        val ? val.split(',').filter((ele) => ele) : [],
    },
    /*
    status: {
      text: 'Status',
      getOptions: getOrderStatusEnumValues,
      inputType: 'select',
      component: ChipColumn,
      columnOptions: {
        smallMode: true,
        valuesMap: orderStatusMap,
      },
    },
    */
    events: generateMultipleJoinableField({
      fieldname: 'events',
      text: 'Events',
      typename: 'event',
      inputType: 'multiple-select',
      fieldOptions: {
        /*
        getOptions: (that) =>
          getEvents(that, false, {
            sortBy: [
              {
                field: 'sortIndex',
                desc: false,
              },
            ],
          }),
        */
        inputOptions: {
          hasAvatar: true,
          typename: 'productTag',
          hasName: true,
        },
        columnOptions: {
          disablePreview: true,
        },
      },
    }),
  },
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
      ...generateSortOptions('createdAt'),
      ...generateSortOptions('updatedAt'),
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
      'totalCost',
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
      'totalCost',
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
      'totalCost',
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
      'totalCost',
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
  postOptions: {},
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
