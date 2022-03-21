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
import * as myModels from '~/models/my'
import { capitalizeString, kebabToCamelCase } from '~/services/base'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  middleware: ['router-auth'],

  components: {
    CrudRecordPage,
  },

  computed: {
    currentModel() {
      return myModels[`My${capitalizeString(this.type)}`]
    },

    lockedFilters() {
      const myFilterFieldFn =
        this.currentModel?.paginationOptions?.myFilterField

      // defaults to "createdBy" is current user
      return myFilterFieldFn
        ? myFilterFieldFn(this)
        : [
            {
              field: 'createdBy',
              operator: 'eq',
              value: this.$store.getters['auth/user'].id,
            },
          ]
    },
  },
}
</script>
