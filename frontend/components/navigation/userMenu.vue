<template>
  <v-menu
    :close-on-content-click="true"
    :close-on-click="true"
    :max-width="300"
    offset-y
    bottom
  >
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
            <v-img v-if="firebaseUser.photoURL" :src="firebaseUser.photoURL" />
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
        <v-subheader>Organization</v-subheader>
        <v-list-item @click.stop="openOrganizationDialog()">
          <PreviewRecordChip
            v-if="organizationUserMemberLink"
            :item="organizationUserMemberLink.organization"
          >
            <template slot="rightIcon">
              &nbsp;<i>({{ organizationUserMemberLink.role }})</i>
              <v-icon
                color="pink"
                right
                @click.stop="clearSelection('organizationUserMemberLink')"
                >mdi-close</v-icon
              >
            </template>
          </PreviewRecordChip>
          <v-chip v-else><i>None</i></v-chip>
        </v-list-item>

        <v-subheader>Main Inventory</v-subheader>
        <v-list-item @click.stop="openSelectInventoryDialog()">
          <PreviewRecordChip v-if="inventory" :item="inventory">
            <v-icon
              slot="rightIcon"
              color="pink"
              right
              @click.stop="clearSelection('inventory')"
              >mdi-close</v-icon
            >
          </PreviewRecordChip>
          <v-chip v-else><i>None</i></v-chip></v-list-item
        >
        <v-subheader>Main Dictionary</v-subheader>
        <v-list-item @click.stop="openSelectDictionaryDialog()">
          <PreviewRecordChip v-if="dictionary" :item="dictionary">
            <v-icon
              slot="rightIcon"
              color="pink"
              right
              @click.stop="clearSelection('dictionary')"
              >mdi-close</v-icon
            >
          </PreviewRecordChip>
          <v-chip v-else><i>None</i></v-chip></v-list-item
        >
        <v-subheader>Foreign Dictionary</v-subheader>
        <v-list-item @click.stop="openSelectForeignDictionaryDialog()">
          <PreviewRecordChip v-if="foreignDictionary" :item="foreignDictionary">
            <v-icon
              slot="rightIcon"
              color="pink"
              right
              @click.stop="clearForeignDictionary()"
              >mdi-close</v-icon
            >
          </PreviewRecordChip>
          <v-chip v-else><i>None</i></v-chip></v-list-item
        >
        <v-divider></v-divider>
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
    <SelectOptionDialog
      v-if="dialogs.selectOption"
      :value="dialogs.selectOption.value"
      :options="dialogs.selectOption.options"
      @handle-select="dialogs.selectOption.handleSelect"
      @close="dialogs.selectOption = null"
    >
      <template v-slot:toolbar>
        <v-toolbar flat color="accent">
          <v-icon left>mdi-check</v-icon>
          <v-toolbar-title>
            <span class="headline"
              >Select {{ dialogs.selectOption.title }}</span
            >
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogs.selectOption = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:item>
        <v-chip pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ getIcon(data.item.typename) }}</v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
    </SelectOptionDialog>
  </v-menu>
</template>

<script>
import { mapGetters } from 'vuex'
import firebase from '~/services/fireinit'
import 'firebase/auth'
import { handleError } from '~/services/base'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import SelectOptionDialog from '~/components/dialog/selectOptionDialog.vue'

export default {
  components: {
    PreviewRecordChip,
    SelectOptionDialog,
  },
  data() {
    return {
      accountItems: [
        { title: 'My Profile', to: '/my-profile', exact: false },
        { title: 'Settings', to: '/settings', exact: false },
      ],

      dialogs: {
        selectOption: null,
      },
    }
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
      firebaseUser: 'auth/firebaseUser',
      organizationUserMemberLink: 'organizationUserMemberLink/current',
      inventory: 'inventory/current',
      dictionary: 'dictionary/current',
      foreignDictionary: 'dictionary/foreign',
    }),
  },

  watch: {
    // if this is changed for any reason, force reset of the inventory, dictionary and foreignDictionary
    organizationUserMemberLink(val) {
      // if org was cleared and the route is an org route, go to home page
      if (!val && this.$route.name.match(/^org/)) {
        this.$router.push('/')
        return
      }

      this.$store.dispatch('inventory/loadOptions')
      this.$store.dispatch('dictionary/loadOptions')
    },
  },

  methods: {
    openOrganizationDialog() {
      this.$root.$emit('openCrudRecordDialog', {
        recordInfo: 'SelectOrganizationUserMemberLink',
      })
    },

    openSelectDictionaryDialog() {
      this.dialogs.selectOption = {
        title: 'Main Dictionary',
        value: this.dictionary,
        options: this.$store.getters['dictionary/options'],
        handleSelect: (item) => {
          this.$store.commit('dictionary/setCurrent', item?.id ?? null)

          // need to reload all thing interfaces
          this.$root.$emit('refresh-interface', 'thing')

          this.$notifier.showSnackbar({
            message: `Selected dictionary: ${item ? item.name : 'None'}`,
            variant: 'success',
          })
        },
      }
    },

    openSelectForeignDictionaryDialog() {
      this.dialogs.selectOption = {
        title: 'Foreign Dictionary',
        value: this.foreignDictionary,
        options: this.$store.getters['dictionary/options'],
        handleSelect: (item) => {
          this.$store.commit('dictionary/setForeign', item?.id ?? null)

          // need to reload all thing interfaces
          this.$root.$emit('refresh-interface', 'thing')

          this.$notifier.showSnackbar({
            message: `Selected foreign dictionary: ${
              item ? item.name : 'None'
            }`,
            variant: 'success',
          })
        },
      }
    },

    openSelectInventoryDialog() {
      this.dialogs.selectOption = {
        title: 'Main Inventory',
        value: this.inventory,
        options: this.$store.getters['inventory/options'],
        handleSelect: (item) => {
          this.$store.commit('inventory/setCurrent', item?.id ?? null)

          // need to reload all thing interfaces
          this.$root.$emit('refresh-interface', 'thing')

          this.$notifier.showSnackbar({
            message: `Selected inventory: ${item ? item.name : 'None'}`,
            variant: 'success',
          })
        },
      }
    },

    clearSelection(typename) {
      this.$store.commit(`${typename}/setCurrent`, null)

      this.$notifier.showSnackbar({
        message: `Cleared current ${typename}`,
        variant: 'success',
      })
    },

    clearForeignDictionary() {
      this.$store.commit(`dictionary/setForeign`, null)

      this.$notifier.showSnackbar({
        message: `Cleared current foreign dictionary`,
        variant: 'success',
      })
    },

    logout() {
      try {
        firebase.auth().signOut()

        this.$router.push('/')
      } catch (err) {
        handleError(this, err)
      }
    },
  },
}
</script>
