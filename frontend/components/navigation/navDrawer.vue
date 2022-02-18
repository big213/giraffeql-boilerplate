<template>
  <v-navigation-drawer v-bind="$attrs">
    <nuxt-link to="/" class="hidden-md-and-up">
      <v-img
        :src="require('~/static/logo-horizontal.png')"
        class="ma-3"
        contain
      />
    </nuxt-link>
    <v-divider></v-divider>
    <v-list dense>
      <v-list-item v-for="(item, i) in mainItems" :key="i" :to="item.to" router>
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list v-if="user" dense>
      <v-list-group prepend-icon="mdi-account" no-action>
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title>My Account</v-list-item-title>
          </v-list-item-content>
        </template>

        <v-list-item
          v-for="(item, i) in userItems"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list-group>
    </v-list>
    <v-divider></v-divider>
    <AdminNavRoutes v-if="isAdmin"></AdminNavRoutes>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import AdminNavRoutes from '~/components/navigation/adminNavRoutes.vue'

export default {
  components: {
    AdminNavRoutes,
  },

  data() {
    return {
      mainItems: [
        {
          icon: 'mdi-home',
          title: 'Home',
          to: '/',
        },
      ],
      userItems: [
        {
          icon: 'mdi-account',
          title: 'My Profile',
          to: '/my-profile?expand=0',
        },
        {
          icon: 'mdi-view-grid-plus',
          title: 'My Apps',
          to: '/my-apps',
        },
        {
          icon: 'mdi-file',
          title: 'My Files',
          to: '/my-files',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    isAdmin() {
      return this.$store.getters['auth/user']?.role === 'ADMIN'
    },
  },
}
</script>
