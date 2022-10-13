import { handleLogin, handleLogout } from '~/services/auth'
import firebase from '~/services/fireinit'
import 'firebase/auth'

export default (context) => {
  const { app, store } = context

  return new Promise((resolve) => {
    // listen for auth state changes
    firebase.auth().onAuthStateChanged(async (firebaseAuthPayload) => {
      if (firebaseAuthPayload === null) {
        handleLogout(app, store)
      } else {
        await handleLogin(app, store, firebaseAuthPayload)
      }

      // wait for the above actions to be finished before allowing main application to load
      resolve()
    })
  })
}
