<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <div class="text-center">
        <img :src="logoImageSrc" alt="" style="width: 60%" />
      </div>
      <v-card>
        <v-card-title class="headline">
          Welcome to {{ siteName }}
        </v-card-title>
        <v-card-text>
          <p v-if="siteDescription">
            <span>{{ siteDescription }}.</span>
          </p>
          <p v-if="siteDiscordLink">
            Check out our official
            <a :href="siteDiscordLink" target="_blank">Discord server</a>.
          </p>
          <p v-if="siteContactEmail">
            To get in touch with us, please send us an email at
            <a>{{ siteContactEmail }}</a
            >.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn v-if="user" color="primary" nuxt to="/my-profile">
            <v-icon left> mdi-account </v-icon>
            My Profile</v-btn
          >
          <v-btn v-else color="primary" nuxt to="/login">
            <v-icon left> mdi-login </v-icon>
            Login</v-btn
          >
        </v-card-actions>
      </v-card>
      <ReleaseHistory class="mt-3" />
    </v-container>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import ReleaseHistory from '~/components/common/releaseHistory.vue'
import {
  siteName,
  siteDescription,
  siteContactEmail,
  siteDiscordLink,
  logoHasLightVariant,
} from '~/services/config'

export default {
  components: {
    ReleaseHistory,
  },
  data() {
    return {
      siteName,
      siteDescription,
      siteContactEmail,
      siteDiscordLink,
    }
  },
  head() {
    return {
      title: 'Home',
    }
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    logoImageSrc() {
      return logoHasLightVariant
        ? require(`~/static/logo-vertical${
            this.$vuetify.theme.dark ? '' : '-light'
          }.png`)
        : require('~/static/logo-vertical.png')
    },
  },
}
</script>
