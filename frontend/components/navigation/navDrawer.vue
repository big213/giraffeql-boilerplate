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

    <div v-if="hasAdminPermissions">
      <v-list dense>
        <v-list-group
          v-for="item in adminItems"
          :key="item.title"
          v-model="item.active"
          :prepend-icon="item.action"
          no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </template>
          <template v-for="(child, j) in item.items">
            <v-list-item :key="j" :to="child.to" nuxt router exact-path>
              <v-list-item-content>
                <v-list-item-title>{{ child.title }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list-group>
      </v-list>
    </div>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import { generateNavRouteObject, userHasPermissions } from '~/services/base'
import { logoHasLightVariant } from '~/services/config'
import { generateNavDrawerItems } from '~/services/navigation'
import * as baseModels from '~/models/base'

export default {
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    hasAdminPermissions() {
      return userHasPermissions(this, ['A_A'])
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

    adminItems() {
      return [
        {
          action: 'mdi-star',
          active: false,
          title: 'Administration',
          items: Object.values(baseModels).map((recordInfo) =>
            generateNavRouteObject(this, {
              recordInfo,
              pageOptions: {
                sort: {
                  field: 'createdAt',
                  desc: true,
                },
              },
            })
          ),
        },
      ]
    },
  },
}
</script>
