import { handleLogin, handleLogout } from '~/services/auth'
import { auth } from '~/services/fireinit'

export default (context) => {
  const { app, store, redirect } = context

  return new Promise((resolve) => {
    // listen for auth state changes
    auth.onAuthStateChanged(async (firebaseAuthPayload) => {
      if (firebaseAuthPayload === null) {
        handleLogout(app, store)
      } else {
        await handleLogin(app, store, redirect, firebaseAuthPayload)
      }

      // wait for the above actions to be finished before allowing main application to load
      resolve()
    })
  })
}
