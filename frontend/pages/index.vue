<template>
  <v-layout v-if="redirectPath" column justify-center align-center>
    <CircularLoader></CircularLoader>
  </v-layout>
  <div v-else>
    <v-container style="max-width: 600px">
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
    </v-container>
    <v-container style="max-width: 600px">
      <ReleaseHistory />
    </v-container>
    <v-container fluid style="max-width: 600px">
      <v-layout column justify-left align-left>
        <v-row>
          <v-col cols="12">
            <CrudRecordInterface
              :record-info="homeModels.user.recordInfo"
              :page-options="homeModels.user.pageOptions"
              hide-presets
              dense
              @pageOptions-updated="homeModels.user.pageOptions = $event"
            >
            </CrudRecordInterface>
          </v-col>
        </v-row>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import CircularLoader from '~/components/common/circularLoader.vue'
import CrudRecordInterface from '~/components/interface/crud/crudRecordInterface.vue'
import { generateHomePageRecordInfo } from '~/services/recordInfo'
import * as publicModels from '~/models/public'
import {
  siteName,
  siteDescription,
  siteContactEmail,
  siteDiscordLink,
  logoHasLightVariant,
} from '~/services/config'
import ReleaseHistory from '~/components/common/releaseHistory.vue'

function generateHomeModelObject(recordInfo) {
  return {
    recordInfo,
    pageOptions: undefined,
  }
}

export default {
  components: {
    CircularLoader,
    CrudRecordInterface,
    ReleaseHistory,
  },
  data() {
    return {
      siteName,
      siteDescription,
      siteContactEmail,
      siteDiscordLink,
      redirectPath: null,
      homeModels: {
        user: generateHomeModelObject(
          generateHomePageRecordInfo({
            recordInfo: publicModels.PublicUser,
            title: 'Latest Users',
            columnMode: true,
            limit: 2,
          })
        ),
      },
    }
  },
  head() {
    return {
      title: 'Home',
    }
  },

  created() {
    // if there is a redirectUrl, go there and unset it
    this.redirectPath = localStorage.getItem('redirectPath')

    if (this.redirectPath) {
      localStorage.removeItem('redirectPath')
      this.$router.push(this.redirectPath)
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
