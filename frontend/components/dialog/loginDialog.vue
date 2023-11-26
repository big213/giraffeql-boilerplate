<template>
  <v-dialog scrollable max-width="500px" v-bind="$attrs" v-on="$listeners">
    <v-card>
      <v-toolbar color="accent" flat>
        <v-icon left>{{ modesMap[mode].icon }}</v-icon>
        <v-toolbar-title>{{ modesMap[mode].title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text @click="mode = mode === 'login' ? 'register' : 'login'">{{
          mode === 'login' ? 'Register' : 'Login'
        }}</v-btn>
      </v-toolbar>
      <RegisterInterface
        v-if="mode === 'register'"
        @success="handleLoginSuccess"
      ></RegisterInterface>
      <LoginInterface
        v-else-if="mode === 'login'"
        @success="handleLoginSuccess"
      >
        <template v-slot:actions>
          <v-btn text @click="mode = 'reset'">Password Forgotten</v-btn>
        </template>
      </LoginInterface>
      <PasswordResetInterface v-else></PasswordResetInterface>
    </v-card>
  </v-dialog>
</template>

<script>
import LoginInterface from '~/components/interface/auth/loginInterface.vue'
import RegisterInterface from '~/components/interface/auth/registerInterface.vue'
import PasswordResetInterface from '~/components/interface/auth/passwordResetInterface.vue'

const modesMap = {
  login: {
    title: 'Login',
    icon: 'mdi-login',
  },
  register: {
    title: 'Register',
    icon: 'mdi-account-plus',
  },
  reset: {
    title: 'Reset Password',
    icon: 'mdi-lock-reset',
  },
}

export default {
  components: {
    LoginInterface,
    RegisterInterface,
    PasswordResetInterface,
  },

  props: {},
  data() {
    return {
      modesMap,
      mode: 'login', // login | register | reset
    }
  },

  methods: {
    handleLoginSuccess() {
      this.$emit('login-success')
    },
  },
}
</script>
