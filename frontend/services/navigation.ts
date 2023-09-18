import { generateNavRouteObject } from './base'
import * as publicModels from '../models/public'
import * as myModels from '../models/my'

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
          recordInfo: publicModels.PublicUser,
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
              recordInfo: myModels.MyApiKey,
              pageOptions: {
                sort: {
                  field: 'createdAt',
                  desc: true,
                },
              },
            }),
            generateNavRouteObject(that, {
              recordInfo: myModels.MyFile,
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
              to: '/my-profile',
            },
          ],
        }
      : null,
  ].filter((e) => e)
}
