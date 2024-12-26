<template>
  <CrudRecordPage
    v-if="currentView"
    :view-definition="currentView"
    :locked-filters="lockedFilters"
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
import * as publicViews from '~/models/views/public'
import { capitalizeString, kebabToCamelCase } from '~/services/base'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  components: {
    CrudRecordPage,
  },

  computed: {
    currentView() {
      return publicViews[`Public${capitalizeString(this.type)}View`]
    },
    lockedFilters() {
      const publicFilterFieldFn =
        this.currentView?.paginationOptions?.defaultLockedFilters
      return publicFilterFieldFn ? publicFilterFieldFn(this) : []
    },
  },
}
</script>
