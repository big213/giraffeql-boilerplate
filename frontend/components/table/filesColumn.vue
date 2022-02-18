<template>
  <div v-if="currentValue">
    <div v-if="loading.loadData">
      <v-progress-circular indeterminate size="24"></v-progress-circular>
    </div>
    <div v-else>
      <FileChip
        v-for="(file, index) in filesData"
        :key="index"
        :file="file"
        downloadable
        small
        label
        :close="false"
        class="mr-2"
      ></FileChip>
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { handleError, collectPaginatorData } from '~/services/base'
import FileChip from '~/components/chip/fileChip.vue'

export default {
  components: {
    FileChip,
  },

  mixins: [columnMixin],

  data() {
    return {
      filesData: [],
      loading: {
        loadData: false,
      },
    }
  },
  mounted() {
    this.reset()
  },

  methods: {
    async loadData() {
      this.loading.loadData = true
      try {
        if (Array.isArray(this.currentValue) && this.currentValue.length > 0) {
          // fetch data
          const fileData = await collectPaginatorData(
            this,
            'getFilePaginator',
            {
              id: true,
              name: true,
              size: true,
              contentType: true,
            },
            {
              filterBy: [
                {
                  parentKey: {
                    eq: `${this.item.__typename}_${this.item.id}`,
                  },
                  id: {
                    in: this.currentValue,
                  },
                },
              ],
            }
          )

          this.filesData = this.currentValue
            .map((fileId) => fileData.find((val) => val.id === fileId))
            .filter((val) => val)
        }
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadData = false
    },

    reset() {
      this.loadData()
    },
  },
}
</script>

<style scoped>
.v-chip--pill .v-avatar {
  height: 24px !important;
  width: 24px !important;
}
</style>
