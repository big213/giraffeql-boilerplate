<template>
  <div>
    <a @click="copyIdTokenToClipboard()"
      ><span class="hidden-xs-only">Build </span>{{ buildVersion }}</a
    >
    <v-icon
      v-if="hasNewerVersion && showNewerVersionIcon"
      title="A newer version of this site is available. Click to reload."
      color="pink"
      @click="reloadPage()"
      >mdi-sync-alert</v-icon
    >
    <v-snackbar
      v-model="snackbarStatus"
      multi-line
      bottom
      right
      :timeout="-1"
      app
      color="primary"
    >
      A newer version of this page is available.
      <template v-slot:action="{ attrs }">
        <v-btn
          color="success"
          class="black--text"
          v-bind="attrs"
          @click="reloadPage()"
        >
          Refresh
        </v-btn>
        <v-btn color="pink" text v-bind="attrs" @click="snackbarStatus = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { executeGiraffeql } from '~/services/giraffeql'
import { copyToClipboard, getBuildVersion } from '~/services/base'
import firebase from '~/services/fireinit'
import 'firebase/auth'

export default {
  data() {
    return {
      snackbarStatus: false,
      currentVersion: null,
      latestVersion: null,

      showNewerVersionIcon: false,
    }
  },

  mounted() {
    this.currentVersion = getBuildVersion()
    executeGiraffeql(
      this,
      {
        getRepositoryLatestVersion: true,
      },
      true
    ).then((res) => {
      this.latestVersion = res.tagName
      if (this.hasNewerVersion) {
        // only open the snackbar if not DEV
        if (this.currentVersion !== 'DEV') {
          // only show the snackbar if it has been at least 3 minutes since the release. if it has been more than 3 mins, show immediately
          setTimeout(() => {
            this.snackbarStatus = true
            this.showNewerVersionIcon = true
          }, Math.min(3 * 60 * 1000, Math.max(0, 3 * 60 * 1000 - (new Date() - new Date(res.publishedAt)))))
        } else {
          this.showNewerVersionIcon = true
        }
      }
    })
  },

  computed: {
    hasNewerVersion() {
      return this.latestVersion && this.currentVersion !== this.latestVersion
    },

    buildVersion() {
      return this.currentVersion ?? process.env.buildDate
    },
  },

  methods: {
    reloadPage() {
      location.reload()
    },
    async copyIdTokenToClipboard() {
      if (firebase.auth().currentUser) {
        copyToClipboard(this, await firebase.auth().currentUser.getIdToken())
      }
    },
  },
}
</script>
