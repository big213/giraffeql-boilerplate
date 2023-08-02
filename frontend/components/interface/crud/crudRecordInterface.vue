<template>
  <div>
    <v-card flat>
      <v-container
        v-if="!hidePresets && hasPresetFilters"
        fluid
        class="mx-0 text-center"
      >
        <v-row justify="center" class="mt-3">
          <v-col
            v-if="
              recordInfo.paginationOptions.searchOptions &&
              recordInfo.paginationOptions.searchOptions.preset
            "
            :key="-1"
            cols="12"
            lg="3"
            class="py-0"
          >
            <v-text-field
              v-model="searchInput"
              label="Search"
              placeholder="Type to search"
              outlined
              prepend-icon="mdi-magnify"
              clearable
              @click:clear="handleClearSearch()"
              @keyup.enter="updatePageOptions()"
            ></v-text-field>
          </v-col>
          <v-col
            v-for="(crudFilterObject, i) in visiblePresetFiltersArray"
            :key="i"
            cols="12"
            lg="3"
            class="py-0"
          >
            <GenericInput
              :item="crudFilterObject.inputObject"
              @change="updatePageOptions"
              @handle-input="filterChanged = true"
            ></GenericInput>
          </v-col>
        </v-row>
        <v-toolbar v-if="filterChanged" dense flat color="transparent">
          <v-spacer></v-spacer>
          <v-btn color="primary" class="mb-2" @click="updatePageOptions()">
            <v-icon left>mdi-filter</v-icon>
            Update Filters
          </v-btn>
        </v-toolbar>
      </v-container>
      <v-container v-if="breadcrumbItems.length" fluid class="px-0">
        <v-row>
          <v-breadcrumbs :items="breadcrumbItems">
            <template v-slot:item="{ item }">
              <v-breadcrumbs-item>
                <PreviewRecordChip
                  :value="item.item"
                  class="pointer-cursor"
                  @click="$emit('breadcrumb-item-click', item)"
                >
                </PreviewRecordChip>
              </v-breadcrumbs-item>
            </template>
          </v-breadcrumbs>
        </v-row>
      </v-container>

      <v-toolbar flat color="accent" dense>
        <PreviewRecordChip
          v-if="parentItem && isDialog"
          :value="parentItem"
          class="pointer-cursor"
        >
        </PreviewRecordChip>
        <v-divider
          v-if="parentItem && isDialog"
          class="mx-4"
          inset
          vertical
        ></v-divider>
        <v-icon left>{{ icon || recordInfo.icon || 'mdi-domain' }}</v-icon>
        <v-toolbar-title>{{
          title || recordInfo.title || recordInfo.pluralName
        }}</v-toolbar-title>
        <v-divider
          v-if="recordInfo.addOptions && !recordInfo.addOptions.hidden"
          class="mx-4"
          inset
          vertical
        ></v-divider>
        <v-btn
          v-if="recordInfo.addOptions && !recordInfo.addOptions.hidden"
          color="primary"
          @click="handleAddButtonClick()"
        >
          <v-icon left>mdi-plus</v-icon>
          New
        </v-btn>
        <v-divider
          v-if="recordInfo.paginationOptions.searchOptions"
          class="mx-4"
          inset
          vertical
        ></v-divider>
        <SearchDialog
          v-if="recordInfo.paginationOptions.searchOptions"
          v-model="searchInput"
          @handleSubmit="handleSearchDialogSubmit"
        >
          <template slot="icon">
            <v-badge :value="!!search" dot color="secondary" title="Search">
              <v-icon>mdi-magnify</v-icon>
            </v-badge>
          </template>
        </SearchDialog>
        <v-spacer></v-spacer>
        <v-btn
          v-if="recordInfo.paginationOptions.limitOptions"
          text
          @click="handleViewAllButtonClick"
        >
          View All
        </v-btn>
        <v-menu
          v-if="
            sortOptions.length > 0 &&
            !recordInfo.paginationOptions.hideSortOptions
          "
          offset-y
          left
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              :text="!isXsViewport"
              :icon="isXsViewport"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon :left="!isXsViewport">mdi-sort</v-icon>
              <span v-if="!isXsViewport">{{
                currentSort ? currentSort.text : 'None'
              }}</span></v-btn
            >
          </template>
          <v-list dense>
            <v-list-item
              v-for="(crudSortObject, index) in sortOptions"
              :key="index"
              :class="{ 'selected-bg': currentSort === crudSortObject }"
              @click="setCurrentSort(crudSortObject)"
            >
              <v-list-item-title>{{ crudSortObject.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-switch
          v-if="pollInterval > 0"
          v-model="isPolling"
          class="mt-5"
          label="Auto-Refresh"
        ></v-switch>

        <v-btn
          v-if="hasFilters"
          icon
          title="Filter"
          @click="showFilterInterface = !showFilterInterface"
        >
          <v-badge
            :value="visibleFiltersCount"
            :content="visibleFiltersCount"
            color="secondary"
          >
            <v-icon>mdi-filter-menu</v-icon>
          </v-badge>
        </v-btn>
        <v-btn
          v-if="!recordInfo.paginationOptions.hideViewModeToggle"
          icon
          title="Toggle Grid/List Mode"
          @click="toggleGridMode()"
        >
          <v-icon>{{ isGrid ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
        </v-btn>
        <v-btn
          v-if="recordInfo.importOptions"
          icon
          title="Import Records"
          @click="openImportRecordDialog()"
        >
          <v-icon>mdi-upload</v-icon>
        </v-btn>
        <v-btn
          v-if="recordInfo.paginationOptions.downloadOptions"
          icon
          title="Download Records"
          :loading="loading.exportData"
          @click="exportData()"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
        <v-btn
          v-if="!recordInfo.paginationOptions.hideRefresh"
          :loading="loading.loadData || loading.syncData"
          icon
          title="Refresh"
          @click="reset()"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <slot name="header-action"></slot>
      </v-toolbar>
      <v-container v-if="showFilterInterface" fluid class="pb-0 mt-3">
        <v-row>
          <v-col
            v-if="recordInfo.paginationOptions.searchOptions"
            :key="-1"
            cols="12"
            lg="3"
            class="py-0"
          >
            <v-text-field
              v-model="searchInput"
              label="Search"
              placeholder="Type to search"
              outlined
              prepend-icon="mdi-magnify"
              clearable
              @click:clear="handleClearSearch()"
              @keyup.enter="updatePageOptions()"
            ></v-text-field>
          </v-col>
          <v-col
            v-for="(crudFilterObject, i) in visibleFiltersArray"
            :key="i"
            cols="12"
            lg="3"
            class="py-0"
          >
            <GenericInput
              :item="crudFilterObject.inputObject"
              @change="updatePageOptions"
              @handle-input="filterChanged = true"
            ></GenericInput>
          </v-col>
        </v-row>
        <v-toolbar v-if="filterChanged" dense flat color="transparent">
          <v-spacer></v-spacer>
          <v-btn color="primary" class="mb-2" @click="updatePageOptions()">
            <v-icon left>mdi-filter</v-icon>
            Update Filters
          </v-btn>
        </v-toolbar>
      </v-container>
      <v-card-text
        :class="{
          'dialog-max-height': isDialog,
        }"
        class="pa-0"
      >
        <v-card
          v-if="!recordInfo.paginationOptions.limitOptions"
          :style="
            recordInfo.paginationOptions.minHeight
              ? `min-height: ${recordInfo.paginationOptions.minHeight}`
              : null
          "
          class="text-center"
        >
          <span v-if="isDataLoading">...</span>
          <span v-else-if="!totalRecords">---</span>
          <span v-else class="noselect">
            (Showing {{ records.length }} of {{ totalRecords }}
            {{ recordInfo.pluralName }})
          </span>
        </v-card>
        <v-divider />
        <v-data-iterator
          v-if="isGrid"
          :items="records"
          disable-sort
          disable-pagination
          hide-default-footer
          class="pt-5 elevation-1"
          :loading="loading.loadData"
        >
          <template v-slot:loading>
            <CircularLoader
              v-if="recordInfo.paginationOptions.loaderStyle === 'circular'"
              :style="
                recordInfo.paginationOptions.minHeight
                  ? `min-height: ${recordInfo.paginationOptions.minHeight}`
                  : null
              "
            ></CircularLoader>
            <v-progress-linear v-else indeterminate></v-progress-linear>
          </template>
          <template v-slot:default="props">
            <v-container fluid>
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
                    class="noselect elevation-6"
                    @click="handleGridElementClick(item)"
                  >
                    <div v-if="recordInfo.paginationOptions.heroOptions">
                      <component
                        v-if="
                          recordInfo.paginationOptions.heroOptions.component
                        "
                        :is="recordInfo.paginationOptions.heroOptions.component"
                        :item="item"
                        :record-info="recordInfo"
                      ></component>
                      <v-img
                        v-else
                        :src="
                          recordInfo.paginationOptions.heroOptions
                            .getPreviewImage
                            ? recordInfo.paginationOptions.heroOptions.getPreviewImage(
                                item
                              )
                            : item.avatar
                        "
                        class="white--text align-end"
                        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
                        height="200px"
                      >
                        <template v-slot:placeholder>
                          <v-row
                            class="fill-height ma-0"
                            align="center"
                            justify="center"
                          >
                            <v-icon size="200" color="grey darken-3">{{
                              recordInfo.icon
                            }}</v-icon>
                          </v-row>
                        </template>
                        <v-card-title class="subheading font-weight-bold"
                          ><span class="break-word"
                            >{{
                              recordInfo.paginationOptions.heroOptions
                                .getPreviewName
                                ? recordInfo.paginationOptions.heroOptions.getPreviewName(
                                    item
                                  )
                                : item.name
                            }}
                          </span>
                        </v-card-title>
                      </v-img>
                    </div>
                    <v-list dense>
                      <v-list-item
                        v-for="(headerItem, j) in headerOptions"
                        :key="j"
                      >
                        <v-list-item-content v-if="!headerItem.hideTitleIfGrid"
                          >{{ headerItem.text }}:</v-list-item-content
                        >
                        <v-list-item-content
                          :class="{ 'text-right': !headerItem.hideTitleIfGrid }"
                        >
                          <component
                            :is="headerItem.fieldInfo.component"
                            v-if="headerItem.fieldInfo.component"
                            :item="item"
                            :field-path="headerItem.path"
                            :options="headerItem.fieldInfo.columnOptions"
                          ></component>
                          <span v-else>
                            {{ getTableRowData(headerItem, item) }}
                          </span>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                    <v-btn
                      v-for="(expandObject, i) in renderedExpandItems"
                      block
                      :key="i"
                      class="mt-1"
                      @click.stop="toggleGridExpand(item, expandObject)"
                    >
                      <v-icon left>{{
                        expandObject.icon || expandObject.recordInfo.icon
                      }}</v-icon>
                      {{ expandObject.name || expandObject.recordInfo.name }}
                    </v-btn>
                    <div
                      v-if="!recordInfo.paginationOptions.hideActions"
                      class="text-center"
                      style="width: 100%"
                    >
                      <v-divider />
                      <RecordActionMenu
                        :record-info="recordInfo"
                        :item="item"
                        expand-mode="emit"
                        bottom
                        offset-y
                        @handle-action-click="openEditDialog"
                        @handle-expand-click="toggleGridExpand(item, ...$event)"
                        @handle-custom-action-click="handleCustomActionClick"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn block text v-bind="attrs" v-on="on">
                            Actions
                          </v-btn>
                        </template>
                      </RecordActionMenu>
                    </div>
                  </v-card>
                </v-col>
                <v-col
                  v-if="!recordInfo.paginationOptions.limitOptions"
                  cols="12"
                >
                  <div class="text-center">
                    <v-divider></v-divider>
                    <v-btn
                      v-if="records.length < totalRecords"
                      text
                      block
                      :loading="loading.loadMore"
                      @click="loadMore()"
                      >View More</v-btn
                    >
                    <span v-if="isDataLoading">...</span>
                    <span v-else-if="!totalRecords">---</span>
                    <span v-else class="noselect">
                      (Showing {{ records.length }} of {{ totalRecords }}
                      {{ recordInfo.pluralName }})
                    </span>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </template>
          <template v-slot:no-data
            ><div class="text-center">
              No {{ recordInfo.pluralName }}
            </div></template
          >
        </v-data-iterator>
        <v-data-table
          v-else
          :headers="headerOptions"
          :items="records"
          class="elevation-1"
          :loading="loading.loadData"
          loading-text="Loading... Please wait"
          :server-items-length="totalRecords"
          :dense="dense"
          :expanded.sync="expandedItems"
          :single-expand="hasNested"
          hide-default-footer
        >
          <template v-slot:item="props">
            <tr
              v-if="props.isMobile"
              :key="props.item.id"
              class="v-data-table__mobile-table-row"
              @click="handleRowClick(props)"
            >
              <td
                v-for="(headerItem, i) in headerOptions"
                :key="i"
                class="v-data-table__mobile-row"
              >
                <div
                  v-if="
                    headerItem.value === null &&
                    !recordInfo.paginationOptions.hideActions
                  "
                  class="text-center"
                  style="width: 100%"
                >
                  <v-divider />
                  <RecordActionMenu
                    :record-info="recordInfo"
                    :item="props.item"
                    expand-mode="emit"
                    bottom
                    offset-y
                    @handle-action-click="openEditDialog"
                    @handle-expand-click="toggleItemExpanded(props, ...$event)"
                    @handle-custom-action-click="handleCustomActionClick"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn block text v-bind="attrs" v-on="on">
                        Actions
                      </v-btn>
                    </template>
                  </RecordActionMenu>
                </div>
                <template v-else>
                  <div class="v-data-table__mobile-row__header">
                    {{ headerItem.text }}
                  </div>
                  <div
                    class="v-data-table__mobile-row__cell truncate-mobile-row"
                  >
                    <component
                      :is="headerItem.fieldInfo.component"
                      v-if="headerItem.fieldInfo.component"
                      :item="props.item"
                      :field-path="headerItem.path"
                      :options="headerItem.fieldInfo.columnOptions"
                    ></component>
                    <span v-else>
                      {{ getTableRowData(headerItem, props.item) }}
                    </span>
                  </div>
                </template>
              </td>
            </tr>
            <tr
              v-else
              :key="props.item.id"
              :class="{
                'expanded-row-bg': props.isExpanded,
                'pointer-cursor': !!recordInfo.paginationOptions.handleRowClick,
              }"
              @click="handleRowClick(props)"
            >
              <td
                v-for="(headerItem, i) in headerOptions"
                :key="i"
                :class="headerItem.align ? 'text-' + headerItem.align : null"
                class="truncate"
              >
                <div v-if="headerItem.value === null">
                  <RecordActionMenu
                    :record-info="recordInfo"
                    :item="props.item"
                    expand-mode="emit"
                    left
                    offset-x
                    @handle-action-click="openEditDialog"
                    @handle-expand-click="toggleItemExpanded(props, ...$event)"
                    @handle-custom-action-click="handleCustomActionClick"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn small v-bind="attrs" v-on="on">
                        <v-icon small>mdi-dots-vertical</v-icon></v-btn
                      >
                    </template>
                  </RecordActionMenu>
                </div>
                <span v-else>
                  <component
                    :is="headerItem.fieldInfo.component"
                    v-if="headerItem.fieldInfo.component"
                    :item="props.item"
                    :field-path="headerItem.path"
                    :options="headerItem.fieldInfo.columnOptions"
                  ></component>
                  <span v-else>
                    {{ getTableRowData(headerItem, props.item) }}
                  </span>
                </span>
              </td>
            </tr>
          </template>
          <template v-slot:footer>
            <div
              v-if="!recordInfo.paginationOptions.limitOptions"
              class="text-center"
            >
              <v-divider></v-divider>
              <v-btn
                v-if="records.length < totalRecords"
                text
                block
                :loading="loading.loadMore"
                @click="loadMore()"
                >View More</v-btn
              >
              <span v-if="isDataLoading">...</span>
              <span v-else-if="!totalRecords">---</span>
              <span v-else class="noselect">
                (Showing {{ records.length }} of {{ totalRecords }}
                {{ recordInfo.pluralName }})
              </span>
            </div>
          </template>

          <template v-if="hasNested" v-slot:expanded-item="{ headers }">
            <td :colspan="headers.length" class="pr-0">
              <component
                :is="childInterfaceComponent"
                class="mb-2 expanded-table-bg"
                :record-info="expandTypeObject.recordInfo"
                :icon="expandTypeObject.icon"
                :title="expandTypeObject.name"
                :hidden-headers="expandTypeObject.excludeHeaders"
                :locked-filters="lockedSubFilters"
                :page-options="subPageOptions"
                :hidden-filters="hiddenSubFilters"
                is-child-component
                :parent-item="expandedItem"
                :dense="dense"
                :breadcrumb-items="subBreadcrumbItems"
                :results-per-page="expandTypeObject.resultsPerPage"
                :hide-presets="!expandTypeObject.showPresets"
                @pageOptions-updated="handleSubPageOptionsUpdated"
                @reload-parent-item="handleReloadParentItem"
                @expand-type-updated="handleExpandTypeUpdated"
              >
                <template v-slot:header-action>
                  <v-btn icon @click="closeExpandedItems()">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </template>
              </component>
            </td>
          </template>
          <template v-slot:no-data>No records</template>
        </v-data-table>
      </v-card-text>
      <v-card-actions v-if="isDialog">
        <slot name="footer-action"></slot>
      </v-card-actions>
      <EditRecordDialog
        v-model="dialogs.editRecord"
        :record-info="recordInfo"
        :selected-item="dialogs.selectedItem"
        :mode="dialogs.editMode"
        @reload-parent="reset({ resetExpanded: true })"
        @close="dialogs.editRecord = false"
      ></EditRecordDialog>
      <v-dialog
        v-model="dialogs.expandRecord"
        scrollable
        :max-width="$vuetify.breakpoint.name === 'xs' ? '100%' : '75%'"
      >
        <component
          :is="childInterfaceComponent"
          v-if="dialogs.expandRecord && expandTypeObject"
          :record-info="expandTypeObject.recordInfo"
          :icon="expandTypeObject.icon"
          :title="expandTypeObject.name"
          :hidden-headers="expandTypeObject.excludeHeaders"
          :locked-filters="lockedSubFilters"
          :page-options="subPageOptions"
          :hidden-filters="hiddenSubFilters"
          is-child-component
          is-dialog
          :parent-item="expandedItem"
          :dense="dense"
          :breadcrumb-items="subBreadcrumbItems"
          :results-per-page="expandTypeObject.resultsPerPage"
          :hide-presets="!expandTypeObject.showPresets"
          @pageOptions-updated="handleSubPageOptionsUpdated"
          @reload-parent-item="handleReloadParentItem"
          @expand-type-updated="handleExpandTypeUpdated"
        >
          <template v-slot:header-action>
            <v-btn icon @click="dialogs.expandRecord = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
          <template v-slot:footer-action>
            <v-spacer></v-spacer>
            <v-btn
              color="blue darken-1"
              text
              @click="dialogs.expandRecord = false"
              >Close</v-btn
            >
          </template>
        </component>
      </v-dialog>
    </v-card>
  </div>
</template>

<script>
import crudMixin from '~/mixins/crud'

export default {
  name: 'CrudRecordInterface',

  mixins: [crudMixin],
}
</script>

<style scoped>
.v-data-table
  > .v-data-table__wrapper
  > table
  > tbody
  > tr.expanded-row-bg:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) {
  background: var(--v-secondary-base);
}

.selected-bg {
  background-color: var(--v-primary-base);
}
</style>
