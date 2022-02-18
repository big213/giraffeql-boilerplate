<template>
  <v-footer v-bind="$attrs">
    <VersionCheckText />
    <span>&nbsp;&copy; {{ new Date().getFullYear() }}</span>
    <v-spacer></v-spacer>
    <nuxt-link to="/legal/privacy" class="mr-2"> Privacy & Terms </nuxt-link>
    <v-icon
      v-if="siteDiscordLink"
      small
      class="mr-2"
      @click="openLink(siteDiscordLink)"
      >mdi-discord</v-icon
    >
    <v-icon
      v-if="siteGithubRepositoryUrl"
      small
      class="mr-2"
      @click="openLink(siteGithubRepositoryUrl)"
      >mdi-github</v-icon
    >
    <v-icon
      v-if="siteContactEmail"
      small
      class="mr-2"
      :title="siteContactEmail"
      @click="copyToClipboard(siteContactEmail)"
      >mdi-email</v-icon
    >
    <v-icon small class="mr-2" title="Toggle Brightness" @click="toggleTheme()"
      >mdi-brightness-4</v-icon
    >
  </v-footer>
</template>

<script>
import VersionCheckText from '~/components/common/versionCheckText.vue'
import { copyToClipboard, openLink } from '~/services/base'
import {
  siteDiscordLink,
  siteGithubRepositoryUrl,
  siteContactEmail,
} from '~/services/config'

export default {
  components: {
    VersionCheckText,
  },
  data() {
    return {
      siteDiscordLink,
      siteGithubRepositoryUrl,
      siteContactEmail,
    }
  },

  methods: {
    copyToClipboard(content) {
      return copyToClipboard(this, content)
    },
    openLink,

    toggleTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('theme', this.$vuetify.theme.dark ? 'dark' : 'light')
    },
  },
}
</script>
