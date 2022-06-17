<template>
  <div v-if="currentValue">
    <div v-if="loading.loadData">
      <v-progress-circular indeterminate size="24"></v-progress-circular>
    </div>
    <div v-else>
      <FileChip
        v-for="(file, index) in rawFiles"
        :key="index"
        :file="file"
        downloadable
        openable
        small
        label
        :close="false"
        class="mr-2"
      ></FileChip>
      <v-container fluid grid-list-xs class="px-0">
        <v-layout row wrap>
          <MediaChip
            v-for="(file, index) in previewableFiles"
            :key="index"
            :file="file"
            downloadable
            openable
            class="md4 sm6 xs12"
          ></MediaChip>
        </v-layout>
      </v-container>
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { handleError, collectPaginatorData } from '~/services/base'
import FileChip from '~/components/chip/fileChip.vue'
import MediaChip from '~/components/chip/mediaChip.vue'

export default {
  components: {
    FileChip,
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

  computed: {
    previewableFiles() {
      return this.filesData.filter((file) =>
        file.contentType.startsWith('image')
      )
    },
    rawFiles() {
      return this.filesData.filter(
        (file) => !file.contentType.startsWith('image')
      )
    },
  },

  created() {
    this.reset()
  },

  methods: {
    async loadData() {
      this.loading.loadData = true
      try {
        if (Array.isArray(this.currentValue) && this.currentValue.length > 0) {
          // fetch data if the type is a string
          if (typeof this.currentValue[0] === 'string') {
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
          } else {
            // otherwise, it should have been pre-loaded
            this.filesData = this.currentValue
          }
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
