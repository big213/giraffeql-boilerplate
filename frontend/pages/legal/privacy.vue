<template>
  <v-container fill-height>
    <v-layout column justify-center align-center>
      <v-flex xs12 sm8 md6 style="max-width: 600px">
        <v-card>
          <v-card-title class="headline"> Privacy & Terms </v-card-title>
          <v-card-text>
            <p>
              <i>Last Updated: 10 April 2021</i>
            </p>
            <p>
              {{ siteDescription }}
            </p>
            <div class="pb-2">
              <span class="subheader">Data</span>
              <ul>
                <li>
                  By default, your profile page, with your user information and
                  PBs will be made publicly visible for everyone to see.
                  However, you can adjust this behavior in the
                  <nuxt-link to="/settings">settings page</nuxt-link>.
                </li>
              </ul>
            </div>
            <div class="pb-2">
              <span class="subheader">Security</span>
              <ul>
                <li>
                  This website works strictly over HTTPS to provide you a
                  secured environment.
                </li>
                <li>
                  Your email address is not accessible by other users on the
                  site. However, it can be viewed by the site administrator, for
                  administration purposes. We promise not to share your email
                  with others.
                </li>
              </ul>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" nuxt to="/">
              <v-icon left> mdi-home </v-icon>
              Back to Home</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { siteName, siteDescription } from '~/services/config'

export default {
  data() {
    return {
      siteName,
      siteDescription,
    }
  },
  methods: {},
}
</script>
