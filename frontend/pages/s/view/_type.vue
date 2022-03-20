<template>
  <ViewRecordPage
    v-if="currentModel"
    :record-info="currentModel"
  ></ViewRecordPage>
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
import * as specialModels from '~/models/special'
import { kebabToCamelCase } from '~/services/base'

// type -> specialModel
const modelsTypeMap = {}

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  components: {
    ViewRecordPage,
  },

  computed: {
    currentModel() {
      return modelsTypeMap[type]
    },
  },
}
</script>
