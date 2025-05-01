import { camelToKebabCase, userHasPermissions, userHasRole } from './base'
import * as views from '../models/views'
import * as actions from '../models/actions'
import * as baseViews from '../models/views/base'
import { generateNavRouteObject } from './route'

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
          viewDefinition: views.PublicUserView,
          pageOptions: {
            sort: 'createdAt-desc',
          },
        }),
      ],
    },
    that.$store.getters['auth/user']
      ? {
          title: 'My Account',
          items: [
            generateNavRouteObject(that, {
              viewDefinition: views.MyApiKeyView,
              pageOptions: {
                sort: 'createdAt-desc',
              },
            }),
            generateNavRouteObject(that, {
              viewDefinition: views.MyFileView,
              pageOptions: {
                sort: 'createdAt-desc',
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
    userHasPermissions(that, ['*'])
      ? {
          title: 'Administration',
          items: [
            userHasPermissions(that, ['*'])
              ? {
                  title: 'Models',
                  icon: 'mdi-star',
                  collapsible: true,
                  items: Object.values(baseViews)
                    .sort((a, b) => a.entity.name.localeCompare(b.entity.name))
                    .map((viewDefinition) =>
                      generateNavRouteObject(that, {
                        viewDefinition,
                        pageOptions: {
                          sort: 'createdAt-desc',
                        },
                      })
                    ),
                }
              : null,
            userHasPermissions(that, ['*'])
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
