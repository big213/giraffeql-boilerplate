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
            <p>{{ siteDescription }}.</p>
            <div class="pb-2">
              <span class="title">Data</span>
              <ul>
                <li>
                  By default, your profile page will be visible for others to
                  see. However, you can adjust this behavior in the
                  <nuxt-link to="/my/view/profile">My Profile page</nuxt-link>
                  (click <v-icon small>mdi-pencil</v-icon> Edit on the top-right
                  of that page).
                </li>
              </ul>
            </div>
            <div class="pb-2">
              <span class="title">Security</span>
              <ul>
                <li>
                  This website works strictly over HTTPS to provide you a
                  secured environment.
                </li>
                <li>
                  Payment processing services are handled by
                  <a href="https://stripe.com/" target="_blank">Stripe</a>. Any
                  payment data is sent over an encrypted connection and is not
                  stored on our servers.
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
import { siteName, siteDescription } from '~/config'

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
