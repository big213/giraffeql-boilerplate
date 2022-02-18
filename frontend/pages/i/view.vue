<template>
  <ViewRecordPage
    v-if="currentModel"
    :record-info="currentModel"
  ></ViewRecordPage>
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
import ViewRecordPage from '~/components/page/viewRecordPage.vue'
import * as publicModels from '~/models/public'
import { capitalizeString } from '~/services/base'

export default {
  components: {
    ViewRecordPage,
  },

  computed: {
    currentModel() {
      return publicModels[`Public${capitalizeString(this.$route.query.type)}`]
    },
  },
}
</script>
