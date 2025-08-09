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
          v-model="inputs.password"
          label="Current Password"
          prepend-icon="mdi-lock"
          type="password"
          hint="Only required if changing your password"
          persistent-hint
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
import { executeApiRequest } from '~/services/api'
import { handleUserRefreshed } from '~/services/auth'
import { auth } from '~/services/fireinit'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  updateEmail,
  updatePassword,
} from 'firebase/auth'

export default {
  data() {
    return {
      inputs: null,
      originalInputs: {
        newEmail: '',
        newPassword: '',
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
        this.inputs.newEmail !== auth.currentUser.email ||
        this.inputs.newPassword
      )
    },
    currentUser() {
      return auth.currentUser
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
        const currentUser = auth.currentUser

        await sendEmailVerification(currentUser)

        this.$root.$emit('showSnackbar', {
          message: `Verification email sent`,
          color: 'success',
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
        const credential = EmailAuthProvider.credential(
          this.currentUser.email,
          this.inputs.password
        )

        await reauthenticateWithCredential(this.currentUser, credential)

        // update email if different
        if (this.currentUser.email !== this.inputs.newEmail.trim()) {
          await updateEmail(this.currentUser, this.inputs.newEmail.trim())

          // also update email on the api
          await executeApiRequest({
            userSyncCurrent: {
              id: true,
            },
          })

          // refresh the store entry
          handleUserRefreshed(this)
        }

        // update password if different and provided
        if (this.inputs.newPassword) {
          await updatePassword(this.currentUser, this.inputs.newPassword)
        }

        this.reset()

        this.$root.$emit('showSnackbar', {
          message: `User login information updated successfully`,
          color: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submitting = false
    },

    reset() {
      this.inputs = { ...this.originalInputs }
      this.inputs.newEmail = auth.currentUser.email
    },
  },
}
</script>
