import { logAnalyticsEvent } from '~/services/analytics'

export default function ({ store, redirect, route }) {
  // send google analytics event
  // extract and add only the id query param
  logAnalyticsEvent('screen_view', {
    firebase_screen: `${route.path}${
      route.query.id ? `?id=${route.query.id}` : ''
    }`,
    firebase_screen_class: route.name,
  })
}
