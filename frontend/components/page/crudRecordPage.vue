<template>
  <v-container fluid style="max-width: 1920px">
    <v-layout column justify-left align-left>
      <v-row>
        <v-col cols="12">
          <component
            :is="paginationComponent"
            :record-info="
              expandTypeObject ? expandTypeObject.recordInfo : recordInfo
            "
            :page-options="isChildComponent ? subPageOptions : pageOptions"
            :locked-filters="
              isChildComponent ? lockedSubFilters : lockedFilters
            "
            :hidden-filters="hiddenFilters"
            :hidden-headers="
              expandTypeObject ? expandTypeObject.excludeHeaders : hiddenHeaders
            "
            :title="expandTypeObject ? expandTypeObject.name : title"
            :icon="expandTypeObject ? expandTypeObject.icon : icon"
            :poll-interval="pollInterval"
            :parent-item="currentParentItem"
            :breadcrumb-mode="
              expandTypeObject ? !!expandTypeObject.breadcrumbMode : false
            "
            :breadcrumb-items="breadcrumbItems"
            :is-child-component="isChildComponent"
            dense
            @pageOptions-updated="handlePageOptionsUpdated"
            @record-changed="$emit('record-changed', $event)"
            @expand-type-updated="handleExpandTypeUpdated"
          >
            <template v-if="isChildComponent" v-slot:header-action>
              <v-btn icon @click="closeExpand()">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </component>
        </v-col>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
import CrudRecordInterface from '~/components/interface/crud/crudRecordInterface.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import { capitalizeString, generateCrudRecordRoute } from '~/services/base'
import { mapGetters } from 'vuex'

export default {
  components: {
    PreviewRecordChip,
  },

  data() {
    return {
      currentParentItem: null,
      expandTypeObject: null,
      subPageOptions: null,
      breadcrumbItems: [],
    }
  },

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

    isChildComponent() {
      return this.breadcrumbItems.length > 0
    },

    lockedSubFilters() {
      if (!this.expandTypeObject) {
        return []
      }

      // is there a lockedFilters generator on the expandTypeObject? if so, use that
      if (this.expandTypeObject.lockedFilters) {
        return this.expandTypeObject.lockedFilters(this, this.currentParentItem)
      }

      return [
        {
          field: this.recordInfo.typename.toLowerCase() + '.id',
          operator: 'eq',
          value: this.currentParentItem.id,
        },
      ]
    },

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
    closeExpand() {
      if (!this.breadcrumbItems.length) return

      // if there are breadcrumb items, go back
      this.breadcrumbItems.pop()

      const latestItem = this.breadcrumbItems[this.breadcrumbItems.length - 1]

      this.currentParentItem =
        this.breadcrumbItems.length > 1 ? latestItem.item : null

      // if 1 remaining, set expandTypeObject to null
      this.expandTypeObject =
        this.breadcrumbItems.length > 1 ? latestItem.expandTypeObject : null

      // set the pageOptions override
      this.subPageOptions =
        this.breadcrumbItems.length > 1
          ? {
              search: null,
              filters: this.expandTypeObject.initialFilters ?? [],
              sort: this.expandTypeObject.initialSortOptions ?? null,
            }
          : null

      return
    },

    handleExpandTypeUpdated(item, expandTypeObject) {
      // add to breadcrumbs

      this.breadcrumbItems.push({
        expandTypeObject,
        item,
        isRoot: false,
      })

      this.currentParentItem = item
      this.expandTypeObject = expandTypeObject

      // set the pageOptions override
      this.subPageOptions = {
        search: null,
        filters: expandTypeObject.initialFilters ?? [],
        sort: expandTypeObject.initialSortOptions ?? null,
      }
    },

    navigateToDefaultRoute() {
      if (!this.recordInfo.paginationOptions.defaultPageOptions) return

      this.$router.replace(
        generateCrudRecordRoute(this, {
          path: this.$route.path,
          pageOptions:
            this.recordInfo.paginationOptions.defaultPageOptions(this),
        })
      )
    },

    handlePageOptionsUpdated(pageOptions) {
      // if it's a child component, set the subPageOptions
      if (this.isChildComponent) {
        this.subPageOptions = pageOptions
        return
      }

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
