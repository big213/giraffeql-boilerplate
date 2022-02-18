<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-card class="elevation-12">
          <v-toolbar color="accent" flat>
            <v-toolbar-title>Login Credentials</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <UpdateCredentialsInterface></UpdateCredentialsInterface>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import UpdateCredentialsInterface from '~/components/interface/auth/updateCredentialsInterface.vue'

export default {
  middleware: ['router-auth'],
  components: {
    UpdateCredentialsInterface,
  },

  head() {
    return {
      title: 'Settings',
    }
  },
}
</script>
