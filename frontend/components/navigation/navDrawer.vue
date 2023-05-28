<template>
  <v-navigation-drawer v-bind="$attrs">
    <nuxt-link to="/" class="hidden-lg-and-up">
      <v-img :src="logoImageSrc" class="ma-3" contain />
    </nuxt-link>
    <v-divider></v-divider>

    <div v-for="(drawerItem, i) in navDrawerItems" :key="i">
      <v-list dense>
        <v-subheader v-if="drawerItem.title">{{
          drawerItem.title
        }}</v-subheader>
        <v-list-item
          v-for="(item, j) in drawerItem.items"
          :key="j"
          :to="item.to"
          nuxt
          router
          exact-path
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
    </div>

    <div v-if="isAdmin">
      <v-divider></v-divider>
      <AdminNavRoutes></AdminNavRoutes>
    </div>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import AdminNavRoutes from '~/components/navigation/adminNavRoutes.vue'
import { logoHasLightVariant } from '~/services/config'
import { generateNavDrawerItems } from '~/services/navigation'

export default {
  components: {
    AdminNavRoutes,
  },

  data() {
    return {}
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    isAdmin() {
      return this.$store.getters['auth/user']?.role === 'ADMIN'
    },

    logoImageSrc() {
      return logoHasLightVariant
        ? require(`~/static/logo-horizontal${
            this.$vuetify.theme.dark ? '' : '-light'
          }.png`)
        : require('~/static/logo-horizontal.png')
    },

    navDrawerItems() {
      return generateNavDrawerItems(this)
    },
  },
}
</script>
