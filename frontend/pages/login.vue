<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-toolbar color="accent" flat>
          <v-toolbar-title>Login</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn text nuxt to="/register">Register</v-btn>
        </v-toolbar>
        <SocialLoginInterface></SocialLoginInterface>
        <LoginInterface></LoginInterface>
      </v-flex>
    </v-layout>
  </v-container>
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
