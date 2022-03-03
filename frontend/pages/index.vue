<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <div class="text-center">
        <img src="~/static/logo-vertical.png" alt="" style="width: 60%" />
      </div>
      <v-card>
        <v-card-title class="headline">
          Welcome to {{ siteName }}
        </v-card-title>
        <v-card-text>
          <p>
            <span>{{ siteDescription }}</span>
            <span v-if="siteDiscordLink"
              >Check out our official
              <a :href="siteDiscordLink" target="_blank">Discord server</a>.
            </span>
            <span v-if="siteContactEmail"
              >To get in touch with us, please send us an email at
              <a>{{ siteContactEmail }}</a
              >.</span
            >
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
  },
}
</script>
