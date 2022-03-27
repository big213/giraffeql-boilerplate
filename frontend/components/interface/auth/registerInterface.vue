<template>
  <v-card>
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
      ></v-text-field>
      <v-text-field
        id="passwordconfirm"
        v-model="inputs.passwordConfirmation"
        label="Password Confirmation"
        name="passwordconfirm"
        prepend-icon="mdi-lock"
        type="password"
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
import { handleError } from '~/services/base'
import { handleUserRefreshed } from '~/services/auth'
import firebase from '~/services/fireinit'
import 'firebase/auth'

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

        const userCredential = await firebase
          .auth()
          .createUserWithEmailAndPassword(
            this.inputs.email,
            this.inputs.password
          )

        // update the displayName
        await userCredential.user.updateProfile({
          displayName: this.inputs.name,
        })

        // refresh the store entry
        handleUserRefreshed(this, userCredential.user)

        this.$router.push('/')
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },
  },
}
</script>
