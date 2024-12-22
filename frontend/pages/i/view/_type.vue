<template>
  <component
    v-if="currentView"
    :is="pageComponent"
    :view-definition="currentView"
    :lookup-params="lookupParams"
  ></component>
  <v-container v-else fill-height>
    <v-layout align-center justify-center>
      <div>
        <span class="display-1 pl-2">Invalid Type: {{ type }}</span>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import ViewRecordPage from '~/components/page/viewRecordPage.vue'
import * as publicViews from '~/models2/views/public'
import { capitalizeString, kebabToCamelCase } from '~/services/base'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  computed: {
    pageComponent() {
      return this.currentView?.pageOptions?.component ?? ViewRecordPage
    },

    currentView() {
      return publicViews[`Public${capitalizeString(this.type)}View`]
    },

    lookupParams() {
      const getLookupParams = this.currentView?.pageOptions?.getLookupParams

      return getLookupParams ? getLookupParams(this) : undefined
    },
  },
}
</script>
