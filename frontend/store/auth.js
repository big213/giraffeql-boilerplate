export const state = () => ({
  user: null,
  firebaseUser: null,
  isAttemptingLogin: false,
  redirectPath: null,
})

export const mutations = {
  setFirebaseUser(state, authPayload) {
    state.firebaseUser = authPayload.toJSON() || null
  },

  setUser(state, user) {
    state.user = user || null
  },

  unsetUser(state) {
    state.firebaseUser = null
    state.user = null
    state.redirectPath = null
  },

  setIsAttemptingLogin(state, status) {
    state.isAttemptingLogin = status
  },

  setRedirectPath(state, redirectPath) {
    state.redirectPath = redirectPath
  },

  clearRedirectPath(state) {
    state.redirectPath = null
  },
}

export const getters = {
  user(state) {
    return state.user
  },

  firebaseUser(state) {
    return state.firebaseUser
  },

  isAttemptingLogin(state) {
    return state.isAttemptingLogin
  },

  redirectPath(state) {
    return state.redirectPath
  },
}
