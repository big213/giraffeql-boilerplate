<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <v-toolbar color="accent" flat>
        <v-toolbar-title>Login</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text nuxt to="/register">Register</v-btn>
      </v-toolbar>
      <SocialLoginInterface></SocialLoginInterface>
      <LoginInterface></LoginInterface>
    </v-container>
  </v-layout>
</template>

<script>
import LoginInterface from '~/components/interface/auth/loginInterface.vue'
import SocialLoginInterface from '~/components/interface/auth/socialLoginInterface.vue'

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
}
</script>
