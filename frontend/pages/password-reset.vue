<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <v-card class="elevation-12">
        <v-toolbar color="accent" flat>
          <v-toolbar-title>Reset Password</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn text nuxt to="/login">Login</v-btn>
        </v-toolbar>
        <v-card-text>
          <v-text-field
            v-model="inputs.email"
            label="Email"
            name="email"
            prepend-icon="mdi-account"
            type="text"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="loading.submitting"
            @click="handleSubmit()"
            >Reset Password</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-container>
  </v-layout>
</template>

<script>
import { handleError } from '~/services/base'
import firebase from '~/services/fireinit'
import 'firebase/auth'

export default {
  components: {},

  data() {
    return {
      inputs: {
        email: '',
      },

      loading: {
        submitting: false,
      },
    }
  },

  created() {
    this.inputs.email = firebase.auth().currentUser?.email ?? ''
  },

  methods: {
    async handleSubmit() {
      this.loading.submitting = true
      try {
        await firebase.auth().sendPasswordResetEmail(this.inputs.email, {
          // redirect back to login page
          url: window.location.origin + '/login',
        })

        this.$notifier.showSnackbar({
          message: 'Password reset email sent',
          variant: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },
  },

  head() {
    return {
      title: 'Reset Password',
    }
  },
}
</script>
