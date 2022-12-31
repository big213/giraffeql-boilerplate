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
    }),
  },

  methods: {
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
