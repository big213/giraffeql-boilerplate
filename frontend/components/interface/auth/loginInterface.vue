<template>
  <v-card>
    <v-card-text>
      <v-text-field
        v-model="inputs.email"
        label="Login"
        name="login"
        prepend-icon="mdi-account"
        type="text"
      ></v-text-field>
      <v-text-field
        id="password"
        v-model="inputs.password"
        label="Password"
        name="password"
        prepend-icon="mdi-lock"
        type="password"
        @keyup.enter="handleSubmit()"
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-btn text nuxt to="/password-reset">Password Forgotten</v-btn>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        :loading="loading.submitting"
        @click="handleSubmit()"
        >Login</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { handleError } from '~/services/base'
import { auth } from '~/services/fireinit'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { logAnalyticsEvent } from '~/services/analytics'

export default {
  components: {},

  data() {
    return {
      inputs: {
        email: '',
        password: '',
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
        await signInWithEmailAndPassword(
          auth,
          this.inputs.email,
          this.inputs.password
        )

        logAnalyticsEvent('login')

        this.$router.push('/')
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },
  },
}
</script>
