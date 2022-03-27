export default function ({ store, redirect, route }) {
  if (route.name === 'login' || route.name === 'register') {
    if (store.getters['auth/firebaseUser']) {
      console.log('1')
      redirect('/')
    }
  } else if (!store.getters['auth/firebaseUser']) {
    redirect('/login')
  }
}
