<template>
  <ViewRecordPage
    v-if="lookupParams"
    :record-info="recordInfo"
    :lookup-params="lookupParams"
    @handle-submit="handleSubmit"
  ></ViewRecordPage>
</template>

<script>
import ViewRecordPage from '~/components/page/viewRecordPage.vue'
import { MyProfile } from '~/models/special'
import { handleUserRefreshed } from '~/services/auth'

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
  methods: {
    handleSubmit() {
      // on submit, profile was edited, so refresh firebase user
      handleUserRefreshed(this)
    },
  },
}
</script>
