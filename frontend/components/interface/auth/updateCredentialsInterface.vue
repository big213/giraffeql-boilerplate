<template>
  <v-card>
    <v-card-text>
      <v-alert
        v-if="currentUser.emailVerified"
        outlined
        border="left"
        type="success"
      >
        Email verified
      </v-alert>
      <v-alert v-else outlined border="left" type="warning">
        <v-row align="center">
          <v-col class="grow">Email not verified.</v-col>
          <v-col class="shrink">
            <v-btn
              text
              :loading="loading.sendingVerification"
              @click="sendVerificationEmail()"
              >Re-send Verification Email</v-btn
            >
          </v-col>
        </v-row>
      </v-alert>

      <div v-if="userHasPassword">
        <v-text-field
          v-model="inputs.newEmail"
          label="New Email"
          prepend-icon="mdi-account-details"
          type="text"
        ></v-text-field>
        <v-text-field
          v-model="inputs.newPassword"
          label="New Password"
          prepend-icon="mdi-lock"
          type="password"
        ></v-text-field>
        <v-text-field
          v-model="inputs.newPasswordConfirmation"
          label="New Password Confirmation"
          prepend-icon="mdi-lock"
          type="password"
        ></v-text-field>
        <v-text-field
          v-model="inputs.password"
          label="Current Password"
          prepend-icon="mdi-lock"
          type="password"
        ></v-text-field>
      </div>
      <div v-else>
        <span
          >Since you have only signed in with another provider before (e.g.
          Google sign-in), you need to first set up a password by clicking
          "Password Forgotten" if you would like to be able to login directly
          using a password.</span
        >
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn text nuxt to="/password-reset">Password Forgotten</v-btn>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        :loading="loading.submitting"
        :disabled="!isChanged"
        @click="handleSubmit()"
        >Save Changes</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { handleError } from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import { handleUserRefreshed } from '~/services/auth'
import firebase from '~/services/fireinit'
import 'firebase/auth'

export default {
  components: {},

  data() {
    return {
      inputs: null,
      originalInputs: {
        newEmail: '',
        newPassword: '',
        newPasswordConfirmation: '',
        password: '',
      },

      loading: {
        submitting: false,
        sendingVerification: false,
      },
    }
  },

  computed: {
    isChanged() {
      return (
        this.inputs.newEmail !== firebase.auth().currentUser.email ||
        this.inputs.newPassword
      )
    },
    currentUser() {
      return firebase.auth().currentUser
    },
    userHasPassword() {
      return this.currentUser.providerData.some(
        (provider) => provider.providerId === 'password'
      )
    },
  },

  created() {
    this.reset()
  },

  methods: {
    async sendVerificationEmail() {
      this.loading.sendingVerification = true
      try {
        const currentUser = firebase.auth().currentUser

        await currentUser.sendEmailVerification({
          url: window.location.href,
        })

        this.$notifier.showSnackbar({
          message: 'Verification email sent',
          variant: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.sendingVerification = false
    },

    async handleSubmit() {
      this.loading.submitting = true
      try {
        if (!this.inputs.password) {
          throw new Error('Must provide current password')
        }
        // re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
          this.currentUser.email,
          this.inputs.password
        )

        await this.currentUser.reauthenticateWithCredential(credential)

        // update email if different
        if (this.currentUser.email !== this.inputs.newEmail) {
          await this.currentUser.updateEmail(this.inputs.newEmail)

          // also update email on the api
          await executeGiraffeql(this, {
            syncCurrentUser: {
              __args: {
                id: this.$store.getters['auth/user'].id,
                email: this.inputs.newEmail,
              },
            },
          })

          // refresh the store entry
          handleUserRefreshed(this.$store, this.currentUser)
        }

        // update password if different and provided
        if (this.inputs.newPassword) {
          if (this.inputs.newPassword !== this.inputs.newPasswordConfirmation) {
            throw new Error('Password fields must match')
          }

          await this.currentUser.updatePassword(this.inputs.newPassword)
        }

        this.reset()

        this.$notifier.showSnackbar({
          message: 'User login information updated successfully',
          variant: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },

    reset() {
      this.inputs = { ...this.originalInputs }
      this.inputs.newEmail = firebase.auth().currentUser.email
    },
  },
}
</script>
