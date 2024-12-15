<template>
  <v-layout column justify-center align-center fill-height>
    <v-container xs12 style="max-width: 600px">
      <LoginInterface @success="handleSuccess">
        <template v-slot:toolbar>
          <v-toolbar color="accent" flat>
            <v-icon left>mdi-login</v-icon>
            <v-toolbar-title>Login</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn text nuxt to="/register">Register</v-btn>
          </v-toolbar>
        </template>
        <template v-slot:actions>
          <v-btn text nuxt to="/password-reset">Password Forgotten</v-btn>
        </template>
      </LoginInterface>
    </v-container>
  </v-layout>
</template>

<script>
import LoginInterface from '~/components/interface/auth/loginInterface.vue'
import SocialLoginInterface from '~/components/interface/auth/socialLoginInterface.vue'
import { socialLoginEnabled } from '~/services/config'

export default {
  middleware: 'logged-in-redirect',

  components: {
    LoginInterface,
    SocialLoginInterface,
  },

  head() {
    return {
      title: 'Login',
    }
  },

  data() {
    return {
      socialLoginEnabled,
    }
  },

  methods: {
    handleSuccess() {
      // on success, attempt to go to redirectPath (if any, else go to home page)
      this.$router.push(this.$store.getters['auth/redirectPath'] ?? '/')

      // unset the redirect path
      this.$store.commit('auth/clearRedirectPath')
    },
  },
}
</script>
