<template>
  <component
    v-if="currentModel"
    :is="pageComponent"
    :record-info="currentModel"
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
import * as publicModels from '~/models/public'
import { capitalizeString, kebabToCamelCase } from '~/services/base'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  computed: {
    pageComponent() {
      return this.currentModel?.pageOptions?.component ?? ViewRecordPage
    },

    currentModel() {
      return publicModels[`Public${capitalizeString(this.type)}`]
    },

    lookupParams() {
      const getLookupParams = this.currentModel?.pageOptions?.getLookupParams

      return getLookupParams ? getLookupParams(this) : undefined
    },
  },
}
</script>
