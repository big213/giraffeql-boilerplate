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
import { capitalizeString, kebabToCamelCase } from '~/services/base'
import * as myViews from '~/models2/views/my'

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
      return myViews[`My${capitalizeString(this.type)}View`]
    },

    lockedFilters() {
      // defaults to "createdBy" is current user
      return (
        this.currentView?.paginationOptions?.defaultLockedFilters?.(this) ?? [
          {
            field: 'createdBy.id',
            operator: 'eq',
            value: this.$store.getters['auth/user'].id,
          },
        ]
      )
    },
  },
}
</script>
