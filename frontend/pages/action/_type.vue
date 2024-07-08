<template>
  <ExecuteActionPage
    v-if="currentActionOptions"
    :action-options="currentActionOptions"
  >
  </ExecuteActionPage>
  <v-container v-else fill-height>
    <v-layout align-center justify-center>
      <div>
        <span class="display-1 pl-2">Invalid Action: {{ type }}</span>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import ExecuteActionPage from '~/components/page/executeActionPage.vue'
import * as actions from '~/models/actions'
import { kebabToCamelCase } from '~/services/base'

export default {
  async asyncData({ params }) {
    const type = kebabToCamelCase(params.type)
    return { type }
  },

  components: {
    ExecuteActionPage,
  },

  computed: {
    currentActionOptions() {
      return actions[this.type]
    },
  },
}
</script>
