<template>
  <div v-if="currentValue">
    <div v-if="loading.loadData">
      <v-progress-circular indeterminate size="24"></v-progress-circular>
    </div>
    <v-container v-else fluid grid-list-xs class="px-0">
      <v-layout row wrap>
        <MediaChip
          v-for="(file, index) in filesData"
          :key="index"
          :file="file"
          downloadable
          class="xs3"
        ></MediaChip>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { handleError, collectPaginatorData } from '~/services/base'
import MediaChip from '~/components/chip/mediaChip.vue'

export default {
  components: {
    MediaChip,
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
              location: true,
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
