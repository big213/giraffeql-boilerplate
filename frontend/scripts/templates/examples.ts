import SimplifiedTimeStringColumn from '~/components/table/simplifiedTimeStringColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import {
  generateBaseFields,
  generateJoinableField,
  generatePreviewableJoinableField,
  generatePreviewableRecordField,
} from '~/services/recordInfo'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import { getUserRoles } from '~/services/dropdown'

export const Event = {
  typename: 'event',
  pluralTypename: 'events',
  name: 'Event',
  pluralName: 'Events',
  icon: 'mdi-calendar',
  requiredFields: ['name', 'avatar', 'isActive'],
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
        typename: 'locale',
        hasAvatar: true,
        // inputType: 'autocomplete',
        // getOptions: getLocales
      }),
    },
    localeRecord: generatePreviewableRecordField({
      fieldname: 'locale',
      text: 'Locale',
      typename: 'locale',
    }),
    // OR, joinable and previewable fields, combined
    ...generatePreviewableJoinableField({
      text: 'Locale',
      fieldname: 'locale',
      typename: 'locale',
      // inputType: 'autocomplete',
      // getOptions: getLocales
    }),
    endedAt: {
      text: 'Ended At',
      component: TimeagoColumn,
    },
    files: {
      text: 'Files',
      inputType: 'multiple-file',
      default: () => [],
      component: PreviewableFilesColumn,
    },
    role: {
      text: 'User Role',
      getOptions: getUserRoles,
      inputType: 'select',
    },
    permissions: {
      text: 'Custom Permissions',
      serialize: (val: string[]) => val && val.join(','),
      parseValue: (val: string) =>
        val ? val.split(',').filter((ele) => ele) : [],
    },
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
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    handleGridElementClick: (that, item) => {
      that.openEditDialog('view', item)
    },
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
      {
        field: 'startAt',
        desc: false,
      },
      {
        field: 'startAt',
        desc: true,
      },
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
  },
  addOptions: {
    fields: [
      'locale',
      'avatar',
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
      'avatar',
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
  importOptions: {
    fields: [
      'locale',
      'avatar',
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
      'isActive',
    ],
  },
  editOptions: {
    fields: [
      'locale',
      'avatar',
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
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [
    /*
    {
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
        field: 'updatedAt',
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
    await executeGiraffeql(that, {
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
