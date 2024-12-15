<template>
  <v-layout column justify-center align-center fill-height>
    <v-container xs12 style="max-width: 600px">
      <RegisterInterface @success="handleSuccess">
        <template v-slot:toolbar>
          <v-toolbar color="accent" flat>
            <v-icon left>mdi-account-plus</v-icon>
            <v-toolbar-title>Register</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn text nuxt to="/login">Login</v-btn>
          </v-toolbar>
        </template>
      </RegisterInterface>
    </v-container>
  </v-layout>
</template>

<script>
import RegisterInterface from '~/components/interface/auth/registerInterface.vue'
import SocialLoginInterface from '~/components/interface/auth/socialLoginInterface.vue'
import { socialLoginEnabled } from '~/services/config'

export default {
  middleware: 'logged-in-redirect',

  components: {
    RegisterInterface,
    SocialLoginInterface,
  },

  head() {
    return {
      title: 'Register',
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
