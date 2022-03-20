<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <v-card class="elevation-12">
        <v-toolbar color="accent" flat>
          <v-toolbar-title>Login Credentials</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <UpdateCredentialsInterface></UpdateCredentialsInterface>
      </v-card>
    </v-container>
  </v-layout>
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
