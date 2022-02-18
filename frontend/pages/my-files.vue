<template>
  <CrudRecordPage
    :record-info="recordInfo"
    :locked-filters="lockedFilters"
    :title="title"
  ></CrudRecordPage>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { MyFiles } from '~/models'

export default {
  components: {
    CrudRecordPage,
  },

  data() {
    return {
      recordInfo: MyFiles,
      title: 'My Files',
    }
  },
  computed: {
    lockedFilters() {
      return this.$store.getters['auth/user']
        ? [
            {
              field: 'createdBy',
              operator: 'eq',
              value: this.$store.getters['auth/user'].id,
            },
          ]
        : []
    },
  },
}
</script>
