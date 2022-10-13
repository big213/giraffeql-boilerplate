<template>
  <v-container fluid style="max-width: 1920px">
    <v-layout column justify-left align-left>
      <v-row>
        <v-col cols="12">
          <component
            :is="paginationComponent"
            :record-info="recordInfo"
            :page-options="pageOptions"
            :locked-filters="lockedFilters"
            :hidden-filters="hiddenFilters"
            :hidden-headers="hiddenHeaders"
            :title="title"
            :icon="icon"
            :poll-interval="pollInterval"
            dense
            @pageOptions-updated="handlePageOptionsUpdated"
            @record-changed="$emit('record-changed', $event)"
          ></component>
        </v-col>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
import CrudRecordInterface from '~/components/interface/crud/crudRecordInterface.vue'
import { capitalizeString, generateCrudRecordRoute } from '~/services/base'
import { mapGetters } from 'vuex'

export default {
  props: {
    title: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    recordInfo: {
      type: Object,
      required: true,
    },
    hiddenHeaders: {
      type: Array,
    },
    lockedFilters: {
      type: Array,
      default: () => [],
    },
    hiddenFilters: {
      type: Array,
      default: () => [],
    },
    head: {
      type: Object,
      default: () => null,
    },
    pollInterval: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    ...mapGetters({
      newUnreadNotifications: 'user/newUnreadNotifications',
    }),

    paginationComponent() {
      return this.recordInfo.paginationOptions.component || CrudRecordInterface
    },
    capitalizedTypename() {
      return capitalizeString(this.recordInfo.typename)
    },
    // type: CrudPageOptions | null
    pageOptions() {
      return this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
    },
  },

  created() {
    // if no pageOptions, automatically redirect to defaultPageOptions, if any
    if (
      !this.$route.query.pageOptions &&
      this.recordInfo.paginationOptions.defaultPageOptions
    ) {
      this.navigateToDefaultRoute()
    }
  },

  watch: {
    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect if there is a defaultPageOptions
      if (!val && this.recordInfo.paginationOptions.defaultPageOptions) {
        this.navigateToDefaultRoute()
      }
    },
  },

  methods: {
    navigateToDefaultRoute() {
      if (!this.recordInfo.paginationOptions.defaultPageOptions) return

      this.$router.push(
        generateCrudRecordRoute(this, {
          path: this.$route.path,
          pageOptions:
            this.recordInfo.paginationOptions.defaultPageOptions(this),
        })
      )
    },

    handlePageOptionsUpdated(pageOptions) {
      const query = {
        ...this.$route.query,
      }

      // check if any valid options
      if (
        pageOptions.search ||
        pageOptions.filters.length ||
        pageOptions.sort
      ) {
        query.pageOptions = encodeURIComponent(
          btoa(JSON.stringify(pageOptions))
        )
      } else {
        delete query.pageOptions
      }

      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)
      // catches if the query is exactly the same
    },
  },

  head() {
    return {
      title:
        this.title ??
        this.recordInfo.title ??
        'Manage ' + this.recordInfo.pluralName,
    }
  },
}
</script>
