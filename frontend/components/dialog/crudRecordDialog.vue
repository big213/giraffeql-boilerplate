<template>
  <v-dialog
    scrollable
    :max-width="computedMaxWidth"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <component
      :is="paginationComponent"
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      :hidden-headers="hiddenHeaders"
      :page-options="pageOptions || initialPageOptions"
      :element-title="elementTitle"
      :icon="icon"
      :parent-item="parentItem"
      :hide-presets="hidePresets"
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
    elementTitle: {
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
    // if it is a child component, the parent component with at least id
    parentItem: {
      type: Object,
    },
    initialPageOptions: {
      type: Object,
      default: null,
    },
    maxWidth: {
      type: String,
    },
    // should the preset filters be hidden?
    hidePresets: {
      type: Boolean,
      default: false,
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
    '$attrs.value'(val) {
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
