<template>
  <v-card>
    <slot name="toolbar"></slot>
    <v-card-text>
      <v-text-field
        v-model="inputs.name"
        label="Name"
        name="name"
        prepend-icon="mdi-account-details"
        type="text"
      ></v-text-field>
      <v-text-field
        v-model="inputs.email"
        label="Email"
        name="login"
        prepend-icon="mdi-at"
        type="text"
      ></v-text-field>
      <v-text-field
        id="password"
        v-model="inputs.password"
        label="Password"
        name="password"
        prepend-icon="mdi-lock"
        type="password"
      ></v-text-field>
      <v-text-field
        id="passwordconfirm"
        v-model="inputs.passwordConfirmation"
        label="Password Confirmation"
        name="passwordconfirm"
        prepend-icon="mdi-lock"
        type="password"
        @keyup.enter="handleSubmit()"
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        :loading="loading.submitting"
        @click="handleSubmit()"
        >Create Account</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { handleError, timeout } from '~/services/base'
import { handleUserRefreshed } from '~/services/auth'
import { auth } from '~/services/fireinit'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { logAnalyticsEvent } from '~/services/analytics'

export default {
  data() {
    return {
      inputs: {
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
      },

      loading: {
        submitting: false,
      },
    }
  },

  methods: {
    async handleSubmit() {
      this.loading.submitting = true
      try {
        if (this.inputs.password !== this.inputs.passwordConfirmation) {
          throw new Error('Password fields must match')
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          this.inputs.email,
          this.inputs.password
        )

        // update the displayName
        await updateProfile(userCredential.user, {
          displayName: this.inputs.name,
        })

        // refresh the store entry
        handleUserRefreshed(this)

        logAnalyticsEvent('sign_up')

        // wait for handleLogin to finish (detected when this.$store.getters['auth/user'] has been set)
        while (true) {
          if (this.$store.getters['auth/user']) break

          await timeout(500)
        }

        this.$emit('success')
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },
  },
}
</script>
