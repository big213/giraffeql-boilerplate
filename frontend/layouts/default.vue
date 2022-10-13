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
    ></EditRecordDialog>
    <CrudRecordDialog
      v-if="dialogs.crudRecord"
      :record-info="crudRecordDialogRecordInfo"
      :locked-filters="dialogs.crudRecord.lockedFilters"
      :hidden-headers="dialogs.crudRecord.hiddenHeaders"
      :hidden-filters="dialogs.crudRecord.hiddenFilters"
      :initial-page-options="dialogs.crudRecord.pageOptions"
      @close="dialogs.crudRecord = null"
    ></CrudRecordDialog>
    <ExecuteActionDialog
      v-if="dialogs.executeAction"
      :action-options="dialogs.executeAction.actionOptions"
      :item="dialogs.executeAction.item"
      :selected-item="dialogs.executeAction.selectedItem"
      @close="dialogs.executeAction = null"
    ></ExecuteActionDialog>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex'
import Snackbar from '~/components/snackbar/snackbar'
import NavDrawer from '~/components/navigation/navDrawer.vue'
import UserMenu from '~/components/navigation/userMenu.vue'
import Footer from '~/components/navigation/footer.vue'
import EditRecordDialog from '~/components/dialog/editRecordDialog.vue'
import CrudRecordDialog from '~/components/dialog/crudRecordDialog.vue'
import ExecuteActionDialog from '~/components/dialog/executeActionDialog.vue'
import * as allModels from '~/models'
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
      },
    }
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
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

  created() {
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
     ** Expecting recordInfo, lockedFilters?, title, icon, hiddenHeaders?, hiddenFilters, pageOptions?
     */
    this.$root.$on('openCrudRecordDialog', (params) => {
      const model =
        typeof params.recordInfo === 'string'
          ? allModels[params.recordInfo]
          : params.recordInfo
      // confirm the recordInfo exists
      if (model) {
        // set default pageOption and lockedFilters if defined on the model
        if (model.paginationOptions.defaultPageOptions) {
          params.pageOptions = model.paginationOptions.defaultPageOptions(this)
        }

        if (model.paginationOptions.defaultLockedFilters) {
          params.lockedFilters =
            model.paginationOptions.defaultLockedFilters(this)
        }
        this.dialogs.crudRecord = params
      }
    })

    /*
     ** Expecting actionOptions, item, selectedItem?
     */
    this.$root.$on('openExecuteActionDialog', (params) => {
      this.dialogs.executeAction = params
    })
  },
}
</script>
