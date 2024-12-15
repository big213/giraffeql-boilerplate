export default function ({ store, redirect, route }) {
  // if already logged in, redirect to home page
  if (store.getters['auth/firebaseUser']) {
    redirect('/')
  }
}
