<template>
  <v-navigation-drawer v-bind="$attrs">
    <nuxt-link to="/" class="hidden-lg-and-up">
      <v-img :src="logoImageSrc" class="ma-3" contain />
    </nuxt-link>
    <v-divider></v-divider>

    <div v-for="(drawerItem, i) in navDrawerItems" :key="i">
      <v-list dense>
        <v-list-item v-if="drawerItem.title">
          <v-list-item-content>
            <v-list-item-subtitle>{{ drawerItem.title }} </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <div v-for="(item, j) in drawerItem.items" :key="j">
          <v-list-item
            v-if="!item.collapsible"
            :to="item.to"
            nuxt
            router
            :exact="item.exactUrl"
            :exact-path="!item.exactUrl"
          >
            <v-list-item-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-group v-else :prepend-icon="item.icon" no-action>
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item-content>
            </template>
            <template v-for="(childItem, k) in item.items">
              <v-list-item
                :key="k"
                :to="childItem.to"
                nuxt
                router
                :exact="childItem.exactUrl"
                :exact-path="!childItem.exactUrl"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ childItem.title }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list-group>
        </div>
      </v-list>

      <v-divider></v-divider>
    </div>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import { logoHasLightVariant } from '~/config'
import { generateNavDrawerItems } from '~/services/navigation'

export default {
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

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
