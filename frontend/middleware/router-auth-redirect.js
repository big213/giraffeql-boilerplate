export default function ({ store, redirect, route }) {
  // if user is not logged in, save the route and direct to login page
  if (!store.getters['auth/firebaseUser']) {
    store.commit('auth/setRedirectPath', route.fullPath)
    redirect('/login')
  }
}
