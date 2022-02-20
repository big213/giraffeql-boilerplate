<template>
  <CrudRecordPage
    :record-info="recordInfo"
    :title="title"
    :locked-filters="lockedFilters"
  ></CrudRecordPage>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { PublicUser } from '~/models'

export default {
  components: {
    CrudRecordPage,
  },

  data() {
    return {
      recordInfo: PublicUser,
      title: 'Public Users',
    }
  },

  computed: {
    lockedFilters() {
      return [
        {
          field: 'isPublic',
          operator: 'eq',
          value: true,
        },
      ]
    },
  },
}
</script>
