<template>
  <CrudRecordPage
    v-if="currentModel"
    :record-info="currentModel"
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
import { myViews } from '~/models2/views'
import { convertViewDefinition } from '~/services/view'

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
    currentModel() {
      return convertViewDefinition(myViews[capitalizeString(this.type)])
    },

    lockedFilters() {
      // defaults to "createdBy" is current user
      return (
        this.currentModel?.paginationOptions?.defaultLockedFilters?.(this) ?? [
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
