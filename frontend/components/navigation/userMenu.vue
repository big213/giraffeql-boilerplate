<template>
  <v-menu
    :close-on-content-click="true"
    :close-on-click="true"
    :max-width="300"
    offset-y
    bottom
  >
    <template v-slot:activator="{ on, attrs }">
      <v-chip pill v-bind="attrs" v-on="on">
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
              ><v-progress-circular
                v-if="!user"
                class="ml-2"
                indeterminate
                size="16"
              ></v-progress-circular>
              <MappedChip
                small
                :value="user.role"
                :values-map="userRoleMap"
              ></MappedChip>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>
      <v-list dense>
        <v-list-item
          v-for="(item, i) in accountItems"
          :key="i"
          :to="item.to"
          exact-path
          nuxt
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="logout()">
          <v-list-item-action>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
    <SelectOptionDialog
      v-if="dialogs.selectOption"
      v-model="dialogs.selectOption.status"
      :initial-value="dialogs.selectOption.value"
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
import { auth } from '~/services/fireinit'
import { handleError } from '~/services/base'
import { generateUserMenuItems } from '~/services/navigation'
import { userRoleMap } from '~/services/constants'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import SelectOptionDialog from '~/components/dialog/selectOptionDialog.vue'
import MappedChip from '~/components/chip/mappedChip.vue'

export default {
  components: {
    PreviewRecordChip,
    SelectOptionDialog,
    MappedChip,
  },
  data() {
    return {
      userRoleMap,
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

    accountItems() {
      return generateUserMenuItems(this)
    },
  },

  methods: {
    async logout() {
      try {
        await auth.signOut()

        this.$router.push('/')
      } catch (err) {
        handleError(this, err)
      }
    },
  },
}
</script>
