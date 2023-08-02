<template>
  <v-layout column justify-center align-center fill-height>
    <v-container xs12 style="max-width: 600px">
      <v-toolbar color="accent" flat>
        <v-toolbar-title>Login</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text nuxt to="/register">Register</v-btn>
      </v-toolbar>
      <SocialLoginInterface v-if="socialLoginEnabled"></SocialLoginInterface>
      <LoginInterface></LoginInterface>
    </v-container>
  </v-layout>
</template>

<script>
import LoginInterface from '~/components/interface/auth/loginInterface.vue'
import SocialLoginInterface from '~/components/interface/auth/socialLoginInterface.vue'
import { socialLoginEnabled } from '~/services/config'

export default {
  middleware: 'router-auth',

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
}
</script>
