import { executeApiRequest } from './api'
import { handleError, timeout } from './base'
import { auth } from './fireinit'

export async function handleLogin(that, store, redirect, authPayload) {
  // set loading state
  store.commit('auth/setIsAttemptingLogin', true)

  // set the firebase user first
  store.commit('auth/setFirebaseUser', authPayload)

  try {
    // get the current user from the API
    const currentUser = await executeApiRequest<'getCurrentUser'>({
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

    // if any redirectPath, attempt to go there, and unset the path
    if (store.getters['auth/redirectPath']) {
      redirect(store.getters['auth/redirectPath'])
    }

    // unset the redirect path
    store.commit('auth/clearRedirectPath')

    // put the response in the vuex store
    store.commit('auth/setUser', currentUser)

    // unset the redirectPath whenever user logs in or out
    localStorage.removeItem('redirectPath')
  } catch (err) {
    handleError(that, err)
    await auth.signOut()
  }

  // revert loading state
  store.commit('auth/setIsAttemptingLogin', false)
}

// refreshes the store's snapshot of the firebaseUser
export async function handleUserRefreshed(that) {
  await auth.currentUser?.reload()

  // put the response in the vuex store
  that.$store.commit('auth/setFirebaseUser', auth.currentUser)
}

export function handleLogout(that, store) {
  store.commit('auth/unsetUser')
}

// promise that will return when this.$store.getters['auth/user'] has been set, and reject if it hasn't returned within 5 seconds
export function waitForLoginSuccess(that) {
  return new Promise(async (resolve, reject) => {
    let cycle = 0
    while (true) {
      cycle++
      if (that.$store.getters['auth/user']) {
        resolve(true)
        break
      }

      await timeout(500)

      // if reached 10 cycles, throw an err
      if (cycle === 10) {
        reject(new Error(`An error occurred during login, please try again`))
        break
      }
    }
  })
}
