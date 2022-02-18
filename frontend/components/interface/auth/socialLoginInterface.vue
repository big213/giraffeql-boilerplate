<template>
  <v-card>
    <v-card-text>
      <v-btn color="primary" block @click="signInWithGoogle()">
        <v-icon left>mdi-google</v-icon>Sign in with Google</v-btn
      >
    </v-card-text>
    <v-divider></v-divider>
  </v-card>
</template>

<script>
import firebase from '~/services/fireinit'
import 'firebase/auth'

export default {
  methods: {
    signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider()
      firebase.auth().signInWithRedirect(provider)
    },
  },
}
</script>
