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
    <Snackbar
      v-if="snackbar"
      v-model="snackbar.status"
      :params="snackbar.params"
      @input="snackbar = null"
      @close="snackbar = null"
    />
    <EditRecordDialog
      v-if="dialogs.editRecord"
      v-model="dialogs.editRecord.status"
      :view-definition="editRecordDialogViewDefinition"
      :locked-fields="dialogs.editRecord.lockedFields"
      :parent-item="dialogs.editRecord.parentItem"
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
      :action-definition="dialogs.executeAction.action"
      :parent-item="dialogs.executeAction.parentItem"
      :locked-fields="dialogs.executeAction.lockedFields"
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
import Snackbar from '~/components/common/snackbar.vue'
import NavDrawer from '~/components/navigation/navDrawer.vue'
import UserMenu from '~/components/navigation/userMenu.vue'
import Footer from '~/components/navigation/footer.vue'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import CrudRecordDialog from '~/components/dialog/crudRecordDialog.vue'
import ExecuteActionDialog from '~/components/dialog/executeActionDialog.vue'
import LoginDialog from '~/components/dialog/loginDialog.vue'
import * as views from '~/models/views'
import * as actions from '~/models/actions'
import { logoHasLightVariant } from '~/config'

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

      snackbar: null,

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
     ** Expecting viewDefinition, lockedFields, parentItem, mode, customFields?, specialMode?
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
    this.$root.$on('openCrudRecordDialog', async (params) => {
      const model =
        typeof params.viewDefinition === 'string'
          ? views[params.viewDefinition]
          : params.viewDefinition
      // confirm the viewDefinition exists
      if (model) {
        // set default pageOption and lockedFilters if defined on the model
        if (model.paginationOptions.defaultPageOptions) {
          params.pageOptions = await model.paginationOptions.defaultPageOptions(
            this
          )
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
     ** Expecting action: action (string or actionDefinition), parentItem?, lockedFields?
     ** if action.getLockedFields is set, use that to generate the lockedFields
     */
    this.$root.$on('openExecuteActionDialog', (params, loginDialog = false) => {
      // if the action is provided as string, attempt to look up the actionDefinition
      if (typeof params.action === 'string') {
        params.action = actions[params.action]
      }

      // if loginDialog (OR action.isLoginRequired) and not logged in, trigger the login dialog instead and queue the action
      if (
        (loginDialog || params.action.isLoginRequired) &&
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
      if (params.action.getLockedFields && params.lockedFields === undefined) {
        this.dialogs.executeAction = {
          ...params,
          lockedFields: params.action.getLockedFields(this, params.parentItem),
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

    /*
     ** Expecting message, color?, textColor?, copyableText?, timeout?
     */
    this.$root.$on('showSnackbar', (params) => {
      // if there is already a snackbar, unset it and then set the new one with a 500 ms delay
      if (this.snackbar) {
        this.snackbar = null

        setTimeout(() => {
          this.snackbar = {
            status: true,
            params,
          }
        }, 250)
      } else {
        this.snackbar = {
          status: true,
          params,
        }
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
