<template>
  <ViewRecordPage
    v-if="lookupParams"
    :record-info="recordInfo"
    :lookup-params="lookupParams"
  ></ViewRecordPage>
</template>

<script>
import ViewRecordPage from '~/components/page/viewRecordPage.vue'
import { MyProfile } from '~/models/my'

export default {
  middleware: ['router-auth'],
  components: {
    ViewRecordPage,
  },
  data() {
    return {
      recordInfo: MyProfile,
    }
  },
  computed: {
    lookupParams() {
      return this.$store.getters['auth/user']
        ? {
            id: this.$store.getters['auth/user'].id,
          }
        : null
    },
  },
}
</script>
