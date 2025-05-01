<template>
  <v-container v-if="loading.initPageOptions" fill-height>
    <v-layout align-center justify-center>
      <CircularLoader style="min-height: 250px"></CircularLoader>
    </v-layout>
  </v-container>
  <v-container v-else fluid style="max-width: 1920px">
    <v-layout column justify-left align-left>
      <v-row>
        <v-col cols="12">
          <component
            :is="paginationComponent"
            :view-definition="
              expandTypeObject ? expandTypeObject.view : viewDefinition
            "
            :page-options="isChildComponent ? subPageOptions : pageOptions"
            :locked-filters="
              isChildComponent ? lockedSubFilters : lockedFilters
            "
            :hidden-filters="hiddenFilters"
            :hidden-headers="
              expandTypeObject ? expandTypeObject.excludeHeaders : hiddenHeaders
            "
            :element-title="
              expandTypeObject ? expandTypeObject.name : elementTitle
            "
            :icon="expandTypeObject ? expandTypeObject.icon : icon"
            :poll-interval="pollInterval"
            :parent-item="currentParentItem"
            :breadcrumb-mode="
              expandTypeObject ? !!expandTypeObject.breadcrumbOptions : false
            "
            :hide-breadcrumbs="hideBreadcrumbs"
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
import { capitalizeString } from '~/services/base'
import { generateCrudRecordRoute } from '~/services/route'
import { mapGetters } from 'vuex'
import CircularLoader from '~/components/common/circularLoader.vue'

export default {
  components: {
    PreviewRecordChip,
    CircularLoader,
  },

  data() {
    return {
      currentParentItem: null,
      expandTypeObject: null,
      subPageOptions: null,
      breadcrumbItems: [],
      loading: {
        initPageOptions: false,
      },
    }
  },

  props: {
    elementTitle: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    viewDefinition: {
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
          field: this.viewDefinition.entity.typename.toLowerCase() + '.id',
          operator: 'eq',
          value: this.currentParentItem.id,
        },
      ]
    },

    paginationComponent() {
      return (
        this.viewDefinition.paginationOptions.component || CrudRecordInterface
      )
    },
    capitalizedTypename() {
      return capitalizeString(this.viewDefinition.entity.typename)
    },
    // type: CrudPageOptions | null
    pageOptions() {
      return this.$route.query.o
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.o)))
        : null
    },

    hideBreadcrumbs() {
      return !!this.expandTypeObject?.breadcrumbOptions?.hideBreadcrumbs
    },
  },

  created() {
    // if legacy pageOptions param is provided, automatically replace that with o
    if (this.$route.query.pageOptions) {
      this.$router.replace({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          pageOptions: undefined,
          o: this.$route.query.pageOptions,
        },
      })
      // returning because changing $route.query.o will trigger reset already
      return
    }

    this.reset()
  },

  watch: {
    '$route.query.o'() {
      this.reset()
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
              sort: this.expandTypeObject.initialSortKey ?? null,
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
        sort: expandTypeObject.initialSortKey ?? null,
      }
    },

    async navigateToDefaultRoute() {
      if (!this.viewDefinition.paginationOptions.defaultPageOptions) return

      this.$router.replace(
        generateCrudRecordRoute(this, {
          viewDefinition: this.viewDefinition,
          pageOptions:
            await this.viewDefinition.paginationOptions.defaultPageOptions(
              this
            ),
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
        pageOptions.sort ||
        pageOptions.distance?.length
      ) {
        query.o = encodeURIComponent(btoa(JSON.stringify(pageOptions)))
      } else {
        delete query.o
      }

      this.$router
        .replace({
          path: this.$route.path,
          query,
        })
        .catch((e) => e)
      // catches if the query is exactly the same
    },

    async initializePageOptions() {
      this.loading.initPageOptions = true
      try {
        // if no pageOptions, automatically redirect to defaultPageOptions, if any
        if (
          !this.$route.query.o &&
          this.viewDefinition.paginationOptions.defaultPageOptions
        ) {
          await this.navigateToDefaultRoute()
        }
      } catch (err) {
        handleError(this, err)
      }
      this.loading.initPageOptions = false
    },

    reset() {
      this.initializePageOptions()
    },
  },

  head() {
    return {
      title:
        this.elementTitle ??
        this.viewDefinition.title ??
        `Manage ${this.viewDefinition.entity.pluralName}`,
    }
  },
}
</script>
