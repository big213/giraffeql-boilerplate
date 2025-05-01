<template>
  <v-card flat v-bind="$attrs">
    <v-system-bar v-if="draggable || close" lights-out>
      <v-icon v-if="draggable" @click="void 0">mdi-arrow-all</v-icon>
      <v-spacer></v-spacer>
      <v-icon v-if="close" color="error" @click="$emit('handleCloseClick')"
        >mdi-close</v-icon
      >
    </v-system-bar>
    <v-hover v-slot="{ hover }">
      <v-img
        :src="generateFileServingUrl({ bucketPath: file.location })"
        aspect-ratio="1"
        contain
        @click="openFile()"
      >
        <div :class="{ 'image-hover': hover }">
          <div
            :class="{ 'd-none': !hover }"
            class="black--text pa-2 fill-height"
            :title="mediaTitle"
          >
            <v-container class="text-center fill-height justify-center pa-0">
              <v-btn
                v-if="downloadable"
                icon
                :loading="isDownloading"
                @click.stop="downloadFile()"
                ><v-icon color="black">mdi-download</v-icon></v-btn
              >
              <v-btn v-if="openable" icon @click.stop="openFile()"
                ><v-icon color="black">mdi-open-in-new</v-icon></v-btn
              >
              <div class="truncate-mobile-row">{{ mediaTitle }}</div>
            </v-container>
          </div>
        </div>
      </v-img>
    </v-hover>
  </v-card>
</template>

<script>
import { handleError, openLink } from '~/services/base'
import { executeApiRequest } from '~/services/api'
import {
  downloadWithProgress,
  formatBytes,
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
    // can it be opened in a new tab?
    openable: {
      type: Boolean,
      default: false,
    },
    close: {
      type: Boolean,
      default: false,
    },
    draggable: {
      type: Boolean,
      default: false,
    },
    useFirebaseUrl: {
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
    mediaTitle() {
      return `${this.file.name} (${formatBytes(this.file.size)})`
    },

    isDownloading() {
      return this.loading.downloadFile || this.downloadObject?.isDownloading
    },
  },

  methods: {
    generateFileServingUrl,

    async downloadFile() {
      this.loading.downloadFile = true
      try {
        this.$root.$emit('showSnackbar', {
          message: `Download started`,
          color: 'success',
        })

        const data = await executeApiRequest({
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
          this.useFirebaseUrl
            ? this.file.downloadUrl
            : generateFileServingUrl({
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

<style scoped>
.v-card {
  transition: opacity 0.4s ease-in-out;
}

.v-card:not(.on-hover) {
  opacity: 1;
}

.image-hover {
  height: 100%;
  background-color: rgba(196, 196, 196, 0.897);
}
</style>
