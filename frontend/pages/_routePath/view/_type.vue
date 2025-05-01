<template>
  <ViewRecordPage
    v-if="currentView"
    :view-definition="currentView"
  ></ViewRecordPage>
  <v-container v-else fill-height>
    <v-layout align-center justify-center>
      <div>
        <span class="display-1 pl-2"
          >Invalid view: {{ routePath }}/{{ type }}</span
        >
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import ViewRecordPage from '~/components/page/viewRecordPage.vue'
import * as views from '~/models/views'
import { capitalizeString, kebabToCamelCase } from '~/services/base'
import { routePathMap } from '~/config'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return {
      type,
      routePath: params.routePath,
    }
  },

  middleware: ['router-auth-redirect'],

  components: {
    ViewRecordPage,
  },

  computed: {
    currentView() {
      const { routeType } = routePathMap[this.routePath]
      if (!routeType) return null

      return views[
        `${capitalizeString(routeType)}${capitalizeString(this.type)}View`
      ]
    },
  },
}
</script>
