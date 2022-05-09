import { MyProfile } from '../special/myProfile'

export const PublicUser = {
  ...MyProfile,
  title: `Public ${MyProfile.pluralName}`,
  paginationOptions: {
    ...MyProfile.paginationOptions,
    defaultLockedFilters: (_that) => {
      return [
        {
          field: 'isPublic',
          operator: 'eq',
          value: true,
        },
      ]
    },
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  importOptions: undefined,
  enterOptions: {
    routeType: 'i',
  },
}
