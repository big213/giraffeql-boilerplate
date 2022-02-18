<template>
  <CrudRecordPage
    :record-info="recordInfo"
    :locked-filters="lockedFilters"
    :title="title"
  ></CrudRecordPage>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { MyApps } from '~/models'

export default {
  components: {
    CrudRecordPage,
  },

  data() {
    return {
      recordInfo: MyApps,
      title: 'My Apps',
    }
  },
  computed: {
    lockedFilters() {
      return this.$store.getters['auth/user']
        ? [
            {
              field: 'user',
              operator: 'eq',
              value: this.$store.getters['auth/user'].id,
            },
          ]
        : []
    },
  },
}
</script>
