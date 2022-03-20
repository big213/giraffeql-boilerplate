<template>
  <v-app dark>
    <NavDrawer
      v-model="drawer"
      :mini-variant="miniVariant"
      :clipped="clipped"
      fixed
      app
    ></NavDrawer>
    <v-app-bar :clipped-left="clipped" fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <nuxt-link to="/" class="hidden-sm-and-down">
        <img :src="logoImageSrc" style="height: 48px" class="mt-2" />
      </nuxt-link>
      <v-spacer />
      <v-chip v-if="isAttemptingLogin" pill>
        Loading...
        <v-progress-circular
          v-if="!user"
          class="ml-2"
          indeterminate
          size="16"
        ></v-progress-circular>
      </v-chip>
      <template v-else-if="user">
        <v-menu :close-on-content-click="true" :max-width="300" offset-y bottom>
          <template v-slot:activator="{ on }">
            <v-chip pill v-on="on">
              <v-avatar left>
                <v-img
                  v-if="firebaseUser.photoURL"
                  :src="firebaseUser.photoURL"
                ></v-img
                ><v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              {{ firebaseUser.displayName }}
              <v-progress-circular
                v-if="!user"
                class="ml-2"
                indeterminate
                size="16"
              ></v-progress-circular>
            </v-chip>
          </template>

          <v-card>
            <v-list>
              <v-list-item>
                <v-list-item-avatar>
                  <v-img
                    v-if="firebaseUser.photoURL"
                    :src="firebaseUser.photoURL"
                  />
                  <v-icon v-else>mdi-account</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{
                    firebaseUser.displayName
                  }}</v-list-item-title>
                  <v-list-item-subtitle>{{
                    firebaseUser.email
                  }}</v-list-item-subtitle>
                  <v-list-item-subtitle
                    >Role: <span v-if="user">{{ user.role }}</span
                    ><v-progress-circular
                      v-else
                      class="ml-2"
                      indeterminate
                      size="16"
                    ></v-progress-circular
                  ></v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-list dense>
              <v-list-item
                v-for="(item, i) in accountItems"
                :key="i"
                :to="item.to"
                exact
                nuxt
              >
                <v-list-item-content>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="logout()">
                <v-list-item-content>
                  <v-list-item-title>Logout</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </template>
      <v-btn v-else text nuxt to="/login" exact>
        <v-icon left>mdi-login</v-icon>
        Login
      </v-btn>
    </v-app-bar>
    <v-main>
      <nuxt />
    </v-main>
    <Footer :absolute="!fixed" app></Footer>
    <Snackbar />
    <EditRecordDialog
      v-if="dialogs.editRecord"
      :record-info="editRecordDialogRecordInfo"
      :selected-item="dialogs.editRecord.selectedItem"
      :custom-fields="dialogs.editRecord.customFields"
      :special-mode="dialogs.editRecord.specialMode"
      :mode="dialogs.editRecord.mode"
      @close="dialogs.editRecord = null"
      @handleSubmit="handleItemAdded()"
    ></EditRecordDialog>
    <CrudRecordDialog
      v-if="dialogs.crudRecord"
      :record-info="crudRecordDialogRecordInfo"
      :locked-filters="dialogs.crudRecord.lockedFilters"
      :hidden-headers="dialogs.crudRecord.hiddenHeaders"
      :hidden-filters="dialogs.crudRecord.hiddenFilters"
      :page-options="dialogs.crudRecord.pageOptions"
      @close="dialogs.crudRecord = null"
    ></CrudRecordDialog>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex'
import Snackbar from '~/components/snackbar/snackbar'
import { handleError } from '~/services/base'
import NavDrawer from '~/components/navigation/navDrawer.vue'
import Footer from '~/components/navigation/footer.vue'
import firebase from '~/services/fireinit'
import 'firebase/auth'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import CrudRecordDialog from '~/components/dialog/crudRecordDialog.vue'
import * as allModels from '~/models'
import { logoHasLightVariant } from '~/services/config'

export default {
  components: {
    NavDrawer,
    Snackbar,
    Footer,
    EditRecordDialog,
    CrudRecordDialog,
  },
  data() {
    return {
      clipped: true,
      drawer: true,
      fixed: true,
      miniVariant: false,

      dialogs: {
        editRecord: null,
        crudRecord: null,
      },

      accountItems: [
        { title: 'My Profile', to: '/my-profile', exact: false },
        { title: 'Settings', to: '/settings', exact: false },
      ],
    }
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
      firebaseUser: 'auth/firebaseUser',
      isAttemptingLogin: 'auth/isAttemptingLogin',
    }),

    editRecordDialogRecordInfo() {
      return this.dialogs.editRecord
        ? typeof this.dialogs.editRecord.recordInfo === 'string'
          ? allModels[this.dialogs.editRecord.recordInfo]
          : this.dialogs.editRecord.recordInfo
        : null
    },

    crudRecordDialogRecordInfo() {
      return this.dialogs.crudRecord
        ? typeof this.dialogs.crudRecord.recordInfo === 'string'
          ? allModels[this.dialogs.crudRecord.recordInfo]
          : this.dialogs.crudRecord.recordInfo
        : null
    },

    logoImageSrc() {
      return logoHasLightVariant
        ? require(`~/static/logo-horizontal${
            this.$vuetify.theme.dark ? '' : '-light'
          }.png`)
        : require('~/static/logo-horizontal.png')
    },
  },

  mounted() {
    this.drawer = this.$vuetify.breakpoint.name !== 'xs'

    /*
     ** Expecting recordInfo, selectedItem, mode, customFields?, specialMode?
     */
    this.$root.$on('openEditRecordDialog', (params) => {
      // confirm the recordInfo exists
      if (
        typeof params.recordInfo === 'string'
          ? allModels[params.recordInfo]
          : params.recordInfo
      ) {
        this.dialogs.editRecord = params
      }
    })

    /*
     ** Expecting recordInfo, lockedFilters, title, icon, hiddenHeaders, hiddenFilters, pageOptions
     */
    this.$root.$on('openCrudRecordDialog', (params) => {
      // confirm the recordInfo exists
      if (
        typeof params.recordInfo === 'string'
          ? allModels[params.recordInfo]
          : params.recordInfo
      ) {
        this.dialogs.crudRecord = params
      }
    })
  },

  methods: {
    handleItemAdded() {},

    logout() {
      try {
        this.$router.push('/')

        firebase.auth().signOut()
      } catch (err) {
        handleError(this, err)
      }
    },
  },
}
</script>
