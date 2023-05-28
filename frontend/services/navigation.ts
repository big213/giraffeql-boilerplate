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
          routeType: 'i',
          pageOptions: {
            sort: {
              field: 'createdAt',
              desc: true,
            },
          },
        }),
      ],
    },
    {
      title: 'My Account',
      items: [
        generateNavRouteObject(that, {
          recordInfo: myModels.MyApiKey,
          routeType: 'my',
          pageOptions: {
            sort: {
              field: 'createdAt',
              desc: true,
            },
          },
        }),
        generateNavRouteObject(that, {
          recordInfo: myModels.MyFile,
          routeType: 'my',
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
    },
  ]
}
