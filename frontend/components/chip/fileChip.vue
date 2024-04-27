<template>
  <v-chip
    v-bind="$attrs"
    :title="file.name"
    @click:close="$emit('handleCloseClick')"
  >
    <v-avatar left
      ><v-icon small>{{ icon }}</v-icon></v-avatar
    >
    <span style="max-width: 120px" class="truncate">
      {{ file.name }}
    </span>
    <span>&nbsp;({{ formatBytes(file.size) }})</span>
    <span v-if="downloadable">
      <v-progress-circular
        v-if="isDownloading"
        class="ml-2"
        size="12"
        indeterminate
      ></v-progress-circular>
      <v-icon v-else small class="ml-2" @click="downloadFile()"
        >mdi-download</v-icon
      >
    </span>
    <v-icon v-if="openable" small class="ml-2" @click="openFile()"
      >mdi-open-in-new</v-icon
    >
  </v-chip>
</template>

<script>
import { handleError, openLink } from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  downloadWithProgress,
  formatBytes,
  contentTypeIconMap,
  generateFileServingUrl,
} from '~/services/file'

export default {
  props: {
    file: {
      type: Object,
      required: true,
    },
    downloadable: {
      type: Boolean,
      default: false,
    },
    openable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: {
        downloadFile: false,
      },

      downloadObject: null,
    }
  },

  computed: {
    icon() {
      return contentTypeIconMap[this.file.contentType] ?? 'mdi-file'
    },

    isDownloading() {
      return this.loading.downloadFile || this.downloadObject?.isDownloading
    },
  },

  methods: {
    formatBytes,

    async downloadFile() {
      this.loading.downloadFile = true
      try {
        this.$notifier.showSnackbar({
          message: `Download started`,
          variant: 'success',
        })

        const data = await executeGiraffeql(this, {
          getFile: {
            signedUrl: true,
            __args: {
              id: this.file.id,
            },
          },
        })

        this.downloadObject = downloadWithProgress(
          this,
          data.signedUrl,
          this.file.name
        )
      } catch (err) {
        handleError(this, err)
      }
      this.loading.downloadFile = false
    },

    openFile() {
      try {
        openLink(
          generateFileServingUrl({
            bucketPath: this.file.location,
          })
        )
      } catch (err) {
        handleError(this, err)
      }
    },
  },
}
</script>
