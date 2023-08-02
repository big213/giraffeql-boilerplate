<template>
  <v-btn
    v-if="currentFile"
    color="primary"
    small
    :loading="loading.downloadFile"
    @click.stop="downloadFile()"
  >
    <v-icon left>mdi-download</v-icon>
    Download</v-btn
  >
</template>

<script>
import columnMixin from '~/mixins/column'
import { handleError } from '~/services/base'
import { downloadFile } from '~/services/file'
import { executeGiraffeql } from '~/services/giraffeql'

export default {
  mixins: [columnMixin],

  data() {
    return {
      loading: {
        downloadFile: false,
      },
    }
  },

  computed: {
    currentFile() {
      return Array.isArray(this.currentValue)
        ? this.currentValue[0]
        : this.currentValue
    },
  },

  methods: {
    async downloadFile() {
      this.loading.downloadFile = true
      try {
        if (!this.currentFile) throw new Error(`No file to download`)

        this.$notifier.showSnackbar({
          message: `Download started`,
          variant: 'success',
        })

        // if there is custom downloadFile logic, use that
        const fileRecord = await (this.options?.getFile?.(this, this.item) ??
          executeGiraffeql(this, {
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

        downloadFile(this, fileRecord.signedUrl, fileRecord.name)
      } catch (err) {
        handleError(this, err)
      }
      this.loading.downloadFile = false
    },
  },
}
</script>
