<template>
  <v-card>
    <v-card-title class="headline"> Recent Releases </v-card-title>
    <v-card-text>
      <v-progress-linear
        v-if="loading.loadData"
        indeterminate
      ></v-progress-linear>
      <div v-for="(item, i) in releases" v-else :key="i" class="mb-4">
        <span class="headline" :title="item.publishedAt"
          >{{ item.name }} ({{ generateTimeAgoString(item.publishedAt) }})</span
        >
        <div v-html="item.descriptionHTML"></div>
      </div>
      <v-divider />
      <div v-if="siteGithubRepositoryUrl" class="mt-3">
        To see all releases, check out our
        <a :href="siteGithubRepositoryUrl + '/releases'" target="_blank"
          >Github repository</a
        >
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { executeApiRequest } from '~/services/api'
import { generateTimeAgoString } from '~/services/base'
import { siteGithubRepositoryUrl } from '~/config'

export default {
  data() {
    return {
      releases: [],
      siteGithubRepositoryUrl,
      loading: {
        loadData: false,
      },
    }
  },

  created() {
    this.loadData()
  },

  methods: {
    async loadData() {
      this.loading.loadData = true
      try {
        this.releases = await executeApiRequest(
          {
            getRepositoryReleases: {
              __args: {
                first: 5,
              },
            },
          },
          {
            omitIdToken: true,
          }
        )
      } catch (err) {
        // do nothing
      }
      this.loading.loadData = false
    },

    generateTimeAgoString(dateString) {
      return generateTimeAgoString(new Date(dateString).getTime() / 1000)
    },
  },
}
</script>
