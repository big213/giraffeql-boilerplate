<template>
  <v-dialog v-bind="$attrs" v-on="$listeners">
    <v-card flat>
      <v-toolbar flat color="accent">
        <v-icon left>mdi-file-check</v-icon>
        <v-toolbar-title>
          <span class="headline">{{
            `Select File${limit ? ` (Limit ${limit})` : ''}`
          }}</span>
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pt-3">
        <v-data-iterator
          :items="items"
          v-model="selectedItems"
          :items-per-page.sync="itemsPerPage"
          :page.sync="page"
          :search="search"
          :sort-by="sortBy.toLowerCase()"
          :sort-desc="sortDesc"
          hide-default-footer
          :single-select="limit === 1"
        >
          <!--
          <template v-slot:header>
            <v-toolbar dark color="blue darken-3" class="mb-1">
              <v-text-field
                v-model="search"
                clearable
                flat
                solo-inverted
                hide-details
                prepend-inner-icon="mdi-magnify"
                label="Search"
              ></v-text-field>
              <template v-if="$vuetify.breakpoint.mdAndUp">
                <v-spacer></v-spacer>
                <v-select
                  v-model="sortBy"
                  flat
                  solo-inverted
                  hide-details
                  :items="keys"
                  prepend-inner-icon="mdi-magnify"
                  label="Sort by"
                ></v-select>
              </template>
            </v-toolbar>
          </template>
          -->

          <template v-slot:default="props">
            <v-row>
              <v-col
                v-for="item in props.items"
                :key="item.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card
                  @click="props.select(item, !props.isSelected(item))"
                  :class="props.isSelected(item) ? `selected-element` : null"
                  :style="
                    props.isSelected(item)
                      ? `outline: 5px solid var(--v-secondary-base);`
                      : null
                  "
                >
                  <v-img
                    v-if="item.contentType.match(/^image/)"
                    :src="item.servingUrl"
                    class="white--text align-end"
                    contain
                  >
                    <template v-slot:placeholder>
                      <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                      >
                        <v-icon size="200" color="grey darken-3"
                          >mdi-file</v-icon
                        >
                      </v-row>
                    </template>
                  </v-img>
                  <v-img v-else>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-icon size="64" color="grey darken-3">mdi-file</v-icon>
                    </v-row>
                  </v-img>

                  <div>
                    <div class="subheading pt-0">
                      {{ item.name }}
                    </div>
                    <v-divider></v-divider>
                    <div>
                      <span :title="item.createdAt">{{
                        generateTimeAgoString(item.createdAt)
                      }}</span>
                      |
                      {{ formatBytes(item.size) }}
                    </div>
                  </div>

                  <!--
                  <v-divider></v-divider>
                  <span>{{ item.size }}</span>
                  <span v-if="props.isSelected(item)">Selected</span>
                  -->
                </v-card>
              </v-col>
            </v-row>
          </template>

          <template v-slot:footer> </template>
        </v-data-iterator>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
        <v-btn
          color="primary"
          :disabled="!selectedItems.length"
          @click="submit()"
          >Submit ({{ selectedItems.length }})</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import {
  handleError,
  collectPaginatorData,
  generateTimeAgoString,
} from '~/services/base'
import { formatBytes } from '~/services/file'

export default {
  components: {
    PreviewRecordChip,
  },
  data() {
    return {
      loading: {
        loadFiles: false,
      },
      search: '',
      sortDesc: false,
      page: 1,
      itemsPerPage: 12,
      sortBy: 'name',
      keys: ['Name', 'Calories'],
      items: [],
      selectedItems: [],
    }
  },

  props: {
    limit: {
      type: Number,
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
    generateTimeAgoString,
    formatBytes,
    close() {
      this.$emit('close')
    },

    submit() {
      try {
        if (this.limit && this.selectedItems.length > this.limit) {
          throw new Error(`Only ${this.limit} files allowed`)
        }
        this.$emit('handle-submit-success', this.selectedItems)
        this.close()
      } catch (err) {
        handleError(this, err)
      }
    },

    async loadFiles() {
      this.loading.loadFiles = true

      try {
        this.items = await collectPaginatorData({
          operation: 'fileGetPaginator',
          query: {
            id: true,
            name: true,
            size: true,
            contentType: true,
            servingUrl: true,
            location: true,
            createdAt: true,
          },
          args: {
            filterBy: [
              {
                'createdBy.id': {
                  eq: this.$store.getters['auth/user'].id,
                },
              },
            ],
            sortBy: [
              {
                field: 'createdAt',
                desc: true,
              },
            ],
          },
          limit: 12,
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadFiles = false
    },

    reset() {
      this.selectedItems = []
      this.loadFiles()
    },
  },
}
</script>
