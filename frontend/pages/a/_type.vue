<template>
  <CrudRecordPage
    v-if="currentView"
    :view-definition="currentView"
  ></CrudRecordPage>
  <v-container v-else fill-height>
    <v-layout align-center justify-center>
      <div>
        <span class="display-1 pl-2">Invalid Type: {{ type }}</span>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import * as baseViews from '~/models/views/base'
import { capitalizeString, kebabToCamelCase } from '~/services/base'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  middleware: ['router-auth-redirect'],

  components: {
    CrudRecordPage,
  },

  computed: {
    currentView() {
      return baseViews[`Base${capitalizeString(this.type)}View`]
    },
  },
}
</script>
