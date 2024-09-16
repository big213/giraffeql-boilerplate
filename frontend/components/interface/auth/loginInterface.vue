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
      <slot name="actions"></slot>
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
import { waitForLoginSuccess } from '~/services/auth'

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

  props: {},

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

        // wait for handleLogin to finish (detected when this.$store.getters['auth/user'] has been set)
        await waitForLoginSuccess(this)

        this.$emit('success')
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },
  },
}
</script>
