<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-toolbar color="accent" flat>
          <v-toolbar-title>Register</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn text nuxt to="/login">Login</v-btn>
        </v-toolbar>
        <SocialLoginInterface></SocialLoginInterface>
        <RegisterInterface></RegisterInterface>
      </v-flex>
    </v-layout>
  </v-container>
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
