export default function ({ store, redirect, route }) {
  // if user is not logged in, *do not* save the route and direct to login page
  if (!store.getters['auth/firebaseUser']) {
    redirect('/login')
  }
}
