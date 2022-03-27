import { handleLogin, handleLogout } from '~/services/auth'
import firebase from '~/services/fireinit'
import 'firebase/auth'

export default (context) => {
  const { store, redirect } = context

  return new Promise((resolve) => {
    // listen for auth state changes
    firebase.auth().onAuthStateChanged(async (firebaseAuthPayload) => {
      if (firebaseAuthPayload === null) {
        handleLogout(store)
      } else {
        await handleLogin(store, firebaseAuthPayload)
      }

      // always redirect to home page on auth state change
      redirect('/')

      // wait for the above actions to be finished before allowing main application to load
      resolve()
    })
  })
}
