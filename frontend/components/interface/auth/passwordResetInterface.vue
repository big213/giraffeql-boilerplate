<template>
  <v-card>
    <slot name="toolbar"></slot>
    <v-card-text>
      <v-text-field
        v-model="inputs.email"
        label="Email"
        name="email"
        prepend-icon="mdi-at"
        type="text"
        @keyup.enter="handleSubmit()"
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
</template>

<script>
import { handleError } from '~/services/base'
import { auth } from '~/services/fireinit'
import { sendPasswordResetEmail } from 'firebase/auth'

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
    this.inputs.email = auth.currentUser?.email ?? ''
  },

  methods: {
    async handleSubmit() {
      this.loading.submitting = true
      try {
        await sendPasswordResetEmail(auth, this.inputs.email.trim(), {
          // redirect back to login page
          url: window.location.origin + '/login',
        })

        this.$root.$emit('showSnackbar', {
          message: `Password reset email sent`,
          color: 'success',
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
