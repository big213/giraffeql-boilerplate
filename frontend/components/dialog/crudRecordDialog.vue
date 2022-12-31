<template>
  <v-dialog
    v-model="status"
    scrollable
    :max-width="computedMaxWidth"
    persistent
  >
    <component
      :is="paginationComponent"
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      :hidden-headers="hiddenHeaders"
      :page-options="pageOptions || initialPageOptions"
      :title="title"
      :icon="icon"
      is-dialog
      dense
      @pageOptions-updated="handlePageOptionsUpdated"
      @close="close()"
    >
      <template v-slot:header-action>
        <v-btn icon @click="close()">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <template v-slot:footer-action>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
      </template>
    </component>
  </v-dialog>
</template>

<script>
import CrudRecordInterface from '~/components/interface/crud/crudRecordInterface.vue'

export default {
  props: {
    status: {
      type: Boolean,
      default: true,
    },
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
      default: () => [],
    },
    lockedFilters: {
      type: Array,
      default: () => [],
    },
    hiddenFilters: {
      type: Array,
      default: () => [],
    },
    initialPageOptions: {
      type: Object,
      default: null,
    },
    maxWidth: {
      type: String,
    },
  },
  data() {
    return {
      pageOptions: null,
    }
  },

  computed: {
    paginationComponent() {
      return this.recordInfo.paginationOptions?.component ?? CrudRecordInterface
    },

    computedMaxWidth() {
      return (
        this.maxWidth ??
        (this.$vuetify.breakpoint.name === 'xs' ? '100%' : '75%')
      )
    },
  },

  watch: {
    status(val) {
      if (val) {
        this.reset()
      }
    },
  },
  methods: {
    handlePageOptionsUpdated(pageOptions) {
      this.pageOptions = pageOptions
    },

    close() {
      this.$emit('close')
    },

    reset() {},
  },
}
</script>
