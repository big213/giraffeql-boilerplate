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
      <UserMenu v-else-if="user"></UserMenu>
      <v-btn v-else text nuxt to="/login" exact>
        <v-icon left>mdi-login</v-icon>
        Login/Register
      </v-btn>
    </v-app-bar>
    <v-main>
      <nuxt />
    </v-main>

    <Footer :absolute="!fixed" app></Footer>
    <Snackbar />
    <EditRecordDialog
      v-if="dialogs.editRecord"
      v-model="dialogs.editRecord.status"
      :view-definition="editRecordDialogViewDefinition"
      :selected-item="dialogs.editRecord.selectedItem"
      :custom-fields="dialogs.editRecord.customFields"
      :special-mode="dialogs.editRecord.specialMode"
      :mode="dialogs.editRecord.mode"
      @close="dialogs.editRecord = null"
    ></EditRecordDialog>
    <CrudRecordDialog
      v-if="dialogs.crudRecord"
      v-model="dialogs.crudRecord.status"
      :view-definition="crudRecordDialogViewDefinition"
      :locked-filters="dialogs.crudRecord.lockedFilters"
      :hidden-headers="dialogs.crudRecord.hiddenHeaders"
      :hidden-filters="dialogs.crudRecord.hiddenFilters"
      :initial-page-options="dialogs.crudRecord.pageOptions"
      :max-width="dialogs.crudRecord.maxWidth"
      :parent-item="dialogs.crudRecord.parentItem"
      :hide-presets="dialogs.crudRecord.hidePresets"
      @close="dialogs.crudRecord = null"
    ></CrudRecordDialog>
    <ExecuteActionDialog
      v-if="dialogs.executeAction"
      v-model="dialogs.executeAction.status"
      :action-definition="dialogs.executeAction.actionDefinition"
      :item="dialogs.executeAction.item"
      :selected-item="dialogs.executeAction.selectedItem"
      @close="dialogs.executeAction = null"
    ></ExecuteActionDialog>
    <LoginDialog
      v-if="dialogs.login"
      v-model="dialogs.login.status"
      @close="dialogs.login = null"
      @login-success="handleLoginSuccess"
    ></LoginDialog>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex'
import Snackbar from '~/components/snackbar/snackbar.vue'
import NavDrawer from '~/components/navigation/navDrawer.vue'
import UserMenu from '~/components/navigation/userMenu.vue'
import Footer from '~/components/navigation/footer.vue'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import CrudRecordDialog from '~/components/dialog/crudRecordDialog.vue'
import ExecuteActionDialog from '~/components/dialog/executeActionDialog.vue'
import LoginDialog from '~/components/dialog/loginDialog.vue'
import * as views from '~/models/views'
import { logoHasLightVariant } from '~/services/config'

export default {
  components: {
    NavDrawer,
    Snackbar,
    Footer,
    UserMenu,
    EditRecordDialog,
    CrudRecordDialog,
    ExecuteActionDialog,
    LoginDialog,
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
        executeAction: null,
        login: null,
      },

      // { type: string; params: any }
      queuedAction: null,
    }
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
      isAttemptingLogin: 'auth/isAttemptingLogin',
    }),

    editRecordDialogViewDefinition() {
      return this.dialogs.editRecord
        ? typeof this.dialogs.editRecord.viewDefinition === 'string'
          ? views[this.dialogs.editRecord.viewDefinition]
          : this.dialogs.editRecord.viewDefinition
        : null
    },

    crudRecordDialogViewDefinition() {
      return this.dialogs.crudRecord
        ? typeof this.dialogs.crudRecord.viewDefinition === 'string'
          ? views[this.dialogs.crudRecord.viewDefinition]
          : this.dialogs.crudRecord.viewDefinition
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

  watch: {
    'dialogs.login.status'(val) {
      // if the new status is false, clear the queued action
      if (!val) {
        return (this.queuedAction = null)
      }
    },
  },

  created() {
    this.drawer = this.$vuetify.breakpoint.name !== 'xs'

    /*
     ** Expecting viewDefinition, selectedItem, mode, customFields?, specialMode?
     */
    this.$root.$on('openEditRecordDialog', (params) => {
      // confirm the viewDefinition exists
      if (
        typeof params.viewDefinition === 'string'
          ? views[params.viewDefinition]
          : params.viewDefinition
      ) {
        this.$set(params, 'status', true)
        this.dialogs.editRecord = params
      }
    })

    /*
     ** Expecting viewDefinition, lockedFilters?, title?, icon?, hiddenHeaders?, hiddenFilters?, pageOptions?, maxWidth?, parentItem?, hidePresets?
     */
    this.$root.$on('openCrudRecordDialog', (params) => {
      const model =
        typeof params.viewDefinition === 'string'
          ? views[params.viewDefinition]
          : params.viewDefinition
      // confirm the viewDefinition exists
      if (model) {
        // set default pageOption and lockedFilters if defined on the model
        if (model.paginationOptions.defaultPageOptions) {
          params.pageOptions = model.paginationOptions.defaultPageOptions(this)
        }

        if (model.paginationOptions.defaultLockedFilters) {
          params.lockedFilters =
            model.paginationOptions.defaultLockedFilters(this)
        }

        this.$set(params, 'status', true)
        this.dialogs.crudRecord = params
      }
    })

    /*
     ** Expecting action: ActionDefinition, item?, selectedItem?
     ** if actionOptions.selectedItemModifier is set, use that to generate the selectedItem
     */
    this.$root.$on('openExecuteActionDialog', (params, loginDialog = false) => {
      // if loginDialog (OR actionOptions.isLoginRequired) and not logged in, trigger the login dialog instead and queue the action
      if (
        (loginDialog || params.actionOptions.isLoginRequired) &&
        !this.$store.getters['auth/user']
      ) {
        this.dialogs.login = {
          status: true,
        }

        // save the action in the queue
        this.queuedAction = {
          type: 'openExecuteActionDialog',
          params,
        }
        return
      }

      this.$set(params, 'status', true)
      if (params.actionOptions.selectedItemModifier) {
        this.dialogs.executeAction = {
          ...params,
          selectedItem: params.actionOptions.selectedItemModifier(
            this,
            params.item
          ),
        }
      } else {
        this.dialogs.executeAction = params
      }
    })

    // opens a simple login dialog
    this.$root.$on('openLoginDialog', () => {
      if (!this.$store.getters['auth/user']) {
        this.dialogs.login = {
          status: true,
        }

        return
      }
    })
  },

  methods: {
    handleLoginSuccess() {
      // check the queuedAction and execute, if any
      if (this.queuedAction) {
        this.$root.$emit(this.queuedAction.type, this.queuedAction.params)
      }

      // close the dialog
      this.dialogs.login = null
    },
  },

  destroyed() {
    // need to clean up event listeners on destroy
    this.$root.$off('openEditRecordDialog')
    this.$root.$off('openCrudRecordDialog')
    this.$root.$off('openExecuteActionDialog')
    this.$root.$off('openLoginDialog')
  },
}
</script>
