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
import firebase from '~/services/fireinit'
import 'firebase/auth'

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
        await firebase
          .auth()
          .signInWithEmailAndPassword(this.inputs.email, this.inputs.password)

        this.$router.push('/')
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },
  },
}
</script>
