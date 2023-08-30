import { executeGiraffeql } from '~/services/giraffeql'
import firebase from '~/services/fireinit'
import 'firebase/auth'
import { handleError } from './base'

export async function handleLogin(that, store, authPayload) {
  // set loading state
  store.commit('auth/setIsAttemptingLogin', true)

  // set the firebase user first
  store.commit('auth/setFirebaseUser', authPayload)

  try {
    // get the current user from the API
    const currentUser = await executeGiraffeql<'getCurrentUser'>(null, {
      getCurrentUser: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        permissions: true,
        allPermissions: true,
      },
    })

    // put the response in the vuex store
    store.commit('auth/setUser', currentUser)

    // unset the redirectPath whenever user logs in or out
    localStorage.removeItem('redirectPath')
  } catch (err) {
    handleError(that, err)
    firebase.auth().signOut()
  }

  // revert loading state
  store.commit('auth/setIsAttemptingLogin', false)
}

// refreshes the store's snapshot of the firebaseUser
export async function handleUserRefreshed(that) {
  await firebase.auth().currentUser?.reload()

  // put the response in the vuex store
  that.$store.commit('auth/setFirebaseUser', firebase.auth().currentUser)
}

export function handleLogout(that, store) {
  store.commit('auth/unsetUser')
}
