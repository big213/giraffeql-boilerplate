<template>
  <ViewRecordPage
    v-if="lookupParams"
    :record-info="recordInfo"
    :head="head"
    :lookup-params="lookupParams"
    @handle-submit="handleSubmit"
  ></ViewRecordPage>
</template>

<script>
import ViewRecordPage from '~/components/page/viewRecordPage.vue'
import { MyProfile } from '~/models'
import { handleUserRefreshed } from '~/services/auth'

export default {
  middleware: ['router-auth'],
  components: {
    ViewRecordPage,
  },
  data() {
    return {
      recordInfo: MyProfile,
      head: {
        title: 'My Profile',
      },
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
