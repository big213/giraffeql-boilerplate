<template>
  <CrudRecordPage
    v-if="currentModel"
    :record-info="currentModel"
    :locked-filters="lockedFilters"
  ></CrudRecordPage>
  <v-container v-else fill-height>
    <v-layout align-center justify-center>
      <div>
        <span class="display-1 pl-2"
          >Invalid Type: {{ $route.query.type }}</span
        >
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import * as publicModels from '~/models/public'
import { capitalizeString } from '~/services/base'

export default {
  components: {
    CrudRecordPage,
  },

  computed: {
    currentModel() {
      return publicModels[`Public${capitalizeString(this.$route.query.type)}`]
    },

    lockedFilters() {
      return [
        {
          field: 'isPublic',
          operator: 'eq',
          value: true,
        },
      ]
    },
  },
}
</script>
