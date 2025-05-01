import { routePathMap } from '~/config'

export default function ({ store, redirect, route }) {
  // if routePath is set, only redirect if login is required
  if (
    route.params.routePath &&
    !routePathMap[route.params.routePath]?.loginRequired
  ) {
    return
  }

  // if user is not logged in, *do not* save the route and direct to login page
  if (!store.getters['auth/firebaseUser']) {
    redirect('/login')
  }
}
