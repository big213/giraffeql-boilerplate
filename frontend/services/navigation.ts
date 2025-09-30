// important: views must be imported *before* actions
import * as views from '../models/views'
import * as actions from '../models/actions'
import * as baseViews from '../models/views/base'
import { userHasPermissions } from './base'
import {
  generateActionRouteObject,
  generateRouteObject,
  generateViewRouteObject,
} from './route'

export function generateNavDrawerItems(that) {
  return [
    {
      title: null,
      items: [
        generateRouteObject({
          title: 'Home',
          icon: 'mdi-home',
          route: '/',
        }),
      ],
    },
    {
      title: 'Explore',
      items: [
        generateViewRouteObject(that, {
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
            generateViewRouteObject(that, {
              viewDefinition: views.MyApiKeyView,
              pageOptions: {
                sort: 'createdAt-desc',
              },
            }),
            generateViewRouteObject(that, {
              viewDefinition: views.MyFileView,
              pageOptions: {
                sort: 'createdAt-desc',
              },
            }),
            generateRouteObject({
              title: 'My Profile',
              icon: 'mdi-account',
              route: '/my/view/profile',
            }),
          ],
        }
      : null,
    userHasPermissions(that, ['*/*'])
      ? {
          title: 'Administration',
          items: [
            userHasPermissions(that, ['*/*'])
              ? {
                  title: 'Models',
                  icon: 'mdi-star',
                  collapsible: true,
                  items: Object.values(baseViews)
                    .sort((a, b) => a.entity.name.localeCompare(b.entity.name))
                    .map((viewDefinition) =>
                      generateViewRouteObject(that, {
                        viewDefinition,
                        pageOptions: {
                          sort: 'createdAt-desc',
                        },
                      })
                    ),
                }
              : null,
            userHasPermissions(that, ['*/*'])
              ? {
                  title: 'Actions',
                  icon: 'mdi-code-tags',
                  collapsible: true,
                  items: Object.values(actions)
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((actionDefinition) =>
                      generateActionRouteObject({ actionDefinition })
                    ),
                }
              : null,
          ].filter((e) => e),
        }
      : null,
  ].filter((e) => e)
}

export function generateUserMenuItems(that) {
  return [
    generateRouteObject({
      title: 'My Profile',
      icon: 'mdi-account',
      route: '/my/view/profile',
    }),
    generateRouteObject({
      title: 'Settings',
      icon: 'mdi-cog',
      route: '/settings',
    }),
  ]
}
