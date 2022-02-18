<template>
  <v-chip v-bind="$attrs" @click:close="$emit('handleCloseClick')">
    <v-avatar left
      ><v-icon small>{{ icon }}</v-icon></v-avatar
    >
    {{ file.name }} ({{ formatBytes(file.size) }})
    <v-icon v-if="downloadable" small class="ml-2" @click="downloadFile()"
      >mdi-download</v-icon
    >
    <v-icon v-if="openable" small class="ml-2" @click="openFile()"
      >mdi-open-in-new</v-icon
    >
  </v-chip>
</template>

<script>
import { handleError, openLink } from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  downloadFile,
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
    }
  },

  computed: {
    icon() {
      return contentTypeIconMap[this.file.contentType] ?? 'mdi-file'
    },
  },

  methods: {
    formatBytes,

    async downloadFile() {
      this.loading.downloadFile = true
      try {
        const data = await executeGiraffeql(this, {
          getFile: {
            signedUrl: true,
            __args: {
              id: this.file.id,
            },
          },
        })

        downloadFile(this, data.signedUrl, this.file.name)

        this.$notifier.showSnackbar({
          message: `Download started`,
          variant: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.downloadFile = false
    },

    openFile() {
      try {
        openLink(generateFileServingUrl(this.file.location))
      } catch (err) {
        handleError(this, err)
      }
    },
  },
}
</script>

<style scoped></style>
