export const state = () => ({
  user: null,
  firebaseUser: null,
  isAttemptingLogin: false,
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
  },

  setIsAttemptingLogin(state, status) {
    state.isAttemptingLogin = status
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
}
