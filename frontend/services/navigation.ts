import {
  camelToKebabCase,
  generateNavRouteObject,
  userHasPermissions,
} from './base'
import * as models from '../models'
import * as actions from '../models/actions'
import * as baseModels from '../models/base'

export function generateNavDrawerItems(that) {
  return [
    {
      title: null,
      items: [
        {
          icon: 'mdi-home',
          title: 'Home',
          to: '/',
        },
      ],
    },
    {
      title: 'Explore',
      items: [
        generateNavRouteObject(that, {
          recordInfo: models.PublicUser,
          pageOptions: {
            sort: {
              field: 'createdAt',
              desc: true,
            },
          },
        }),
      ],
    },
    that.$store.getters['auth/user']
      ? {
          title: 'My Account',
          items: [
            generateNavRouteObject(that, {
              recordInfo: models.MyApiKey,
              pageOptions: {
                sort: {
                  field: 'createdAt',
                  desc: true,
                },
              },
            }),
            generateNavRouteObject(that, {
              recordInfo: models.MyFile,
              pageOptions: {
                sort: {
                  field: 'createdAt',
                  desc: true,
                },
              },
            }),
            {
              icon: 'mdi-account',
              title: 'My Profile',
              to: '/my/view/profile',
            },
          ],
        }
      : null,
    userHasPermissions(that, ['A_A'])
      ? {
          title: 'Administration',
          items: [
            userHasPermissions(that, ['A_A'])
              ? {
                  title: 'Models',
                  icon: 'mdi-star',
                  collapsible: true,
                  items: Object.values(baseModels)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((recordInfo) =>
                      generateNavRouteObject(that, {
                        recordInfo,
                        pageOptions: {
                          sort: {
                            field: 'createdAt',
                            desc: true,
                          },
                        },
                      })
                    ),
                }
              : null,
            userHasPermissions(that, ['A_A'])
              ? {
                  title: 'Actions',
                  icon: 'mdi-code-tags',
                  collapsible: true,
                  items: Object.entries(actions)
                    .sort(([key, val], [key2, val2]) => key.localeCompare(key2))
                    .map(([key, actionOptions]) => ({
                      title: key,
                      to: `/action/${camelToKebabCase(key)}`,
                    })),
                }
              : null,
          ].filter((e) => e),
        }
      : null,
  ].filter((e) => e)
}

export function generateUserMenuItems(that) {
  return [
    { icon: 'mdi-account', title: 'My Profile', to: '/my/view/profile' },
    { icon: 'mdi-cog', title: 'Settings', to: '/settings' },
  ]
}
