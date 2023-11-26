<template>
  <v-layout column justify-center align-center fill-height>
    <v-container xs12 style="max-width: 600px">
      <v-card class="elevation-12">
        <PasswordResetInterface>
          <template v-slot:toolbar>
            <v-toolbar color="accent" flat>
              <v-icon left>mdi-lock-reset</v-icon>
              <v-toolbar-title>Reset Password</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text nuxt to="/login">Login</v-btn>
            </v-toolbar>
          </template>
        </PasswordResetInterface>
      </v-card>
    </v-container>
  </v-layout>
</template>

<script>
import PasswordResetInterface from '~/components/interface/auth/passwordResetInterface.vue'

export default {
  components: {
    PasswordResetInterface,
  },

  head() {
    return {
      title: 'Reset Password',
    }
  },
}
</script>
