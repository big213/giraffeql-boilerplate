<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <v-toolbar color="accent" flat>
        <v-toolbar-title>Register</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text nuxt to="/login">Login</v-btn>
      </v-toolbar>
      <SocialLoginInterface></SocialLoginInterface>
      <RegisterInterface></RegisterInterface>
    </v-container>
  </v-layout>
</template>

<script>
import RegisterInterface from '~/components/interface/auth/registerInterface.vue'
import SocialLoginInterface from '~/components/interface/auth/socialLoginInterface.vue'

export default {
  middleware: 'router-auth',

  components: {
    RegisterInterface,
    SocialLoginInterface,
  },

  head() {
    return {
      title: 'Register',
    }
  },
}
</script>
