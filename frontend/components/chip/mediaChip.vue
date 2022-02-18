<template>
  <v-flex v-bind="$attrs">
    <v-card flat>
      <v-system-bar v-if="draggable || close" lights-out>
        <v-icon v-if="draggable" @click="void 0">mdi-arrow-all</v-icon>
        <v-spacer></v-spacer>
        <v-icon v-if="close" color="error" @click="$emit('handleCloseClick')"
          >mdi-close</v-icon
        >
      </v-system-bar>
      <v-hover v-slot="{ hover }">
        <v-img
          :src="generateFileServingUrl(file.location)"
          aspect-ratio="1"
          contain
        >
          <div :class="{ 'image-hover': hover }">
            <div :class="{ 'd-none': !hover }" class="black--text pa-2">
              {{ file.name }} ({{ formatBytes(file.size) }})
              <div class="text-center">
                <v-btn v-if="downloadable" icon @click="downloadFile()"
                  ><v-icon color="black">mdi-download</v-icon></v-btn
                >
                <v-btn v-if="openable" icon @click="openFile()"
                  ><v-icon color="black">mdi-open-in-new</v-icon></v-btn
                >
              </div>
            </div>
          </div>
        </v-img>
      </v-hover>
    </v-card>
  </v-flex>
</template>

<script>
import { handleError, openLink } from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  downloadFile,
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
  },
  data() {
    return {
      loading: {
        downloadFile: false,
      },
    }
  },

  computed: {},

  methods: {
    formatBytes,
    generateFileServingUrl,

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
