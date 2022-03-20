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
import * as publicModels from '~/models/public'
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
    currentModel() {
      return publicModels[`Public${capitalizeString(this.type)}`]
    },

    lockedFilters() {
      const publicFilterField =
        this.currentModel?.paginationOptions?.publicFilterField
      return publicFilterField
        ? [
            {
              field: publicFilterField,
              operator: 'eq',
              value: true,
            },
          ]
        : []
    },
  },
}
</script>
