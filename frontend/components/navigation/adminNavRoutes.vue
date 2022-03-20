<template>
  <div>
    <v-divider></v-divider>
    <v-list dense v-bind="$attrs">
      <v-list-group
        v-for="item in adminItems"
        :key="item.title"
        v-model="item.active"
        :prepend-icon="item.action"
        no-action
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title v-text="item.title"></v-list-item-title>
          </v-list-item-content>
        </template>
        <template v-for="child in item.items">
          <v-list-item :key="child.title" :to="child.to" nuxt exact-path>
            <v-list-item-content>
              <v-list-item-title v-text="child.title"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list-group>
    </v-list>
  </div>
</template>

<script>
import { generateCrudRecordRoute } from '~/services/base'
import * as baseModels from '~/models/base'

function generateAdminRouteObject(that, recordInfo) {
  return {
    icon: recordInfo.icon,
    title: recordInfo.title ?? recordInfo.typename,
    to: generateCrudRecordRoute(that, {
      typename: recordInfo.typename,
      routeType: 'a',
    }),
  }
}

export default {
  computed: {
    adminItems() {
      return [
        {
          action: 'mdi-star',
          active: false,
          title: 'Administration',
          items: Object.values(baseModels).map((recordInfo) =>
            generateAdminRouteObject(this, recordInfo)
          ),
        },
      ]
    },
  },
}
</script>
