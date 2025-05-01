<template>
  <v-btn
    v-if="currentFile"
    color="primary"
    small
    :loading="isDownloading"
    @click.stop="downloadFile()"
  >
    <v-icon left>mdi-download</v-icon>
    Download
    <template v-slot:loader>
      <v-progress-circular indeterminate size="16"></v-progress-circular>
      <span class="ml-2">{{ downloadProgress.toFixed(0) }}%</span>
    </template>
  </v-btn>
</template>

<script>
import columnMixin from '~/mixins/column'
import { handleError } from '~/services/base'
import { downloadWithProgress } from '~/services/file'
import { executeApiRequest } from '~/services/api'

export default {
  mixins: [columnMixin],

  data() {
    return {
      loading: {
        downloadFile: false,
      },

      downloadObject: null,
    }
  },

  computed: {
    currentFile() {
      return Array.isArray(this.currentValue)
        ? this.currentValue[0]
        : this.currentValue
    },

    isDownloading() {
      return this.loading.downloadFile || this.downloadObject?.isDownloading
    },

    downloadProgress() {
      return this.downloadObject?.progress ?? 0
    },
  },

  methods: {
    async downloadFile() {
      this.loading.downloadFile = true
      try {
        if (!this.currentFile) throw new Error(`No file to download`)

        this.$root.$emit('showSnackbar', {
          message: `Download started`,
          color: 'success',
        })

        // if there is custom downloadFile logic, use that
        const fileRecord = await (this.options?.getFile?.(this, this.item) ??
          executeApiRequest({
            getFile: {
              name: true,
              signedUrl: true,
              __args: {
                id: this.currentFile.id,
              },
            },
          }))

        if (!fileRecord) {
          throw new Error(`File not found`)
        }

        this.downloadObject = downloadWithProgress(
          this,
          fileRecord.signedUrl,
          fileRecord.name
        )

        // wait for the download to finish
        await this.downloadObject.promise
      } catch (err) {
        handleError(this, err)
      }
      this.loading.downloadFile = false
    },
  },
}
</script>
