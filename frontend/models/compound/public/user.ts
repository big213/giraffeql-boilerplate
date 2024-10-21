import { MyProfile } from '../my/profile'

export const PublicUser = {
  ...MyProfile,
  title: `Public ${MyProfile.pluralName}`,
  routeType: 'i',
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
    importOptions: undefined,
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  enterOptions: {},
}
