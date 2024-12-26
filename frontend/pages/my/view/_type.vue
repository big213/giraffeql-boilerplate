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
import { capitalizeString, kebabToCamelCase } from '~/services/base'
import * as myViews from '~/models/views/my'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  middleware: ['router-auth-redirect'],

  computed: {
    currentView() {
      return myViews[`My${capitalizeString(this.type)}View`]
    },

    pageComponent() {
      return this.currentView?.pageOptions?.component ?? ViewRecordPage
    },
    lookupParams() {
      const getLookupParams = this.currentView?.pageOptions?.getLookupParams

      return getLookupParams
        ? getLookupParams(this)
        : {
            id: this.$store.getters['auth/user'].id,
          }
    },
  },
}
</script>
