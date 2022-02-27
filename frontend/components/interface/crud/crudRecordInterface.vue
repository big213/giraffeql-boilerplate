<template>
  <div :class="{ 'expanded-table-bg': isChildComponent }">
    <v-toolbar flat color="accent" dense>
      <v-icon left>{{ icon || recordInfo.icon || 'mdi-domain' }}</v-icon>
      <v-toolbar-title>{{
        title || `${recordInfo.pluralName}`
      }}</v-toolbar-title>
      <v-divider
        v-if="recordInfo.addOptions"
        class="mx-4"
        inset
        vertical
      ></v-divider>
      <v-btn
        v-if="recordInfo.addOptions"
        color="primary"
        @click="openAddRecordDialog()"
      >
        <v-icon left>mdi-plus</v-icon>
        New
      </v-btn>
      <v-divider
        v-if="recordInfo.paginationOptions.hasSearch"
        class="mx-4"
        inset
        vertical
      ></v-divider>
      <SearchDialog
        v-if="recordInfo.paginationOptions.hasSearch"
        v-model="searchInput"
        @handleSubmit="handleSearchDialogSubmit"
      >
        <template slot="icon">
          <v-badge :value="!!search" dot color="secondary">
            <v-icon>mdi-magnify</v-icon>
          </v-badge>
        </template>
      </SearchDialog>
      <v-spacer></v-spacer>
      <v-menu v-if="sortOptions.length > 0" offset-y left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            :text="!isXsViewport"
            :icon="isXsViewport"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon :left="!isXsViewport">mdi-sort</v-icon>
            <span v-if="!isXsViewport"
              >Sort By: {{ currentSort ? currentSort.text : 'None' }}</span
            ></v-btn
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
      <v-btn icon @click="toggleGridMode()">
        <v-icon>{{ isGrid ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
      </v-btn>
      <v-btn
        v-if="recordInfo.importOptions"
        icon
        @click="openImportRecordDialog()"
      >
        <v-icon>mdi-upload</v-icon>
      </v-btn>
      <v-btn
        v-if="recordInfo.paginationOptions.downloadOptions"
        icon
        :loading="loading.exportData"
        @click="exportData()"
      >
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <v-btn
        :loading="loading.loadData || loading.syncData"
        icon
        @click="reset()"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <slot name="header-action"></slot>
    </v-toolbar>
    <v-container v-if="showFilterInterface" fluid class="pb-0 mt-3">
      <v-row>
        <v-col
          v-if="recordInfo.paginationOptions.hasSearch"
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
    <v-card class="text-center">
      <span v-if="isDataLoading">...</span>
      <span v-else-if="!totalRecords">---</span>
      <span v-else>
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
        <v-progress-linear indeterminate></v-progress-linear>
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
              <v-card @click="handleRowClick(item)">
                <!--
                <v-card-title class="subheading font-weight-bold">
                {{ item.name }}
              </v-card-title>
              <v-divider></v-divider>
              -->
                <v-list dense>
                  <v-list-item
                    v-for="(headerItem, j) in headerOptions"
                    :key="j"
                  >
                    <v-list-item-content
                      >{{ headerItem.text }}:</v-list-item-content
                    >
                    <v-list-item-content class="text-right truncate-mobile-row">
                      <component
                        :is="headerItem.fieldInfo.component"
                        v-if="headerItem.fieldInfo.component"
                        :item="item"
                        :field-path="headerItem.path"
                        :options="headerItem.fieldInfo.columnOptions"
                        @submit="reset({ resetExpanded: false })"
                        @item-updated="reset({ resetExpanded: false })"
                      ></component>
                      <span v-else>
                        {{ getTableRowData(headerItem, item) }}
                      </span>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
                <v-divider />
                <div class="text-center" style="width: 100%">
                  <RecordActionMenu
                    :record-info="recordInfo"
                    :item="item"
                    expand-mode="emit"
                    bottom
                    offset-y
                    @handle-action-click="openEditDialog"
                    @handle-expand-click="openExpandDialog(item, ...$event)"
                    @handle-custom-action-click="handleCustomActionClick"
                    @reload-parent="reset({ resetExpanded: false })"
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
            <v-col cols="12">
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
                <span v-else>
                  (Showing {{ records.length }} of {{ totalRecords }}
                  {{ recordInfo.pluralName }})
                </span>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
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
          @click="handleRowClick(props.item)"
        >
          <td
            v-for="(headerItem, i) in headerOptions"
            :key="i"
            class="v-data-table__mobile-row"
          >
            <div
              v-if="headerItem.value === null"
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
                @handle-expand-click="openExpandDialog(props.item, ...$event)"
                @handle-custom-action-click="handleCustomActionClick"
                @reload-parent="reset({ resetExpanded: false })"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn block text v-bind="attrs" v-on="on"> Actions </v-btn>
                </template>
              </RecordActionMenu>
            </div>
            <template v-else>
              <div class="v-data-table__mobile-row__header">
                {{ headerItem.text }}
              </div>
              <div class="v-data-table__mobile-row__cell truncate-mobile-row">
                <component
                  :is="headerItem.fieldInfo.component"
                  v-if="headerItem.fieldInfo.component"
                  :item="props.item"
                  :field-path="headerItem.path"
                  :options="headerItem.fieldInfo.columnOptions"
                  @submit="reset({ resetExpanded: false })"
                  @item-updated="reset({ resetExpanded: false })"
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
          }"
          @click="handleRowClick(props.item)"
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
                @reload-parent="reset({ resetExpanded: false })"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-icon small v-bind="attrs" v-on="on"
                    >mdi-dots-vertical</v-icon
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
                @submit="reset({ resetExpanded: false })"
                @item-updated="reset({ resetExpanded: false })"
              ></component>
              <span v-else>
                {{ getTableRowData(headerItem, props.item) }}
              </span>
            </span>
          </td>
        </tr>
      </template>
      <template v-slot:footer>
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
          <span v-else>
            (Showing {{ records.length }} of {{ totalRecords }}
            {{ recordInfo.pluralName }})
          </span>
        </div>
      </template>

      <template v-if="hasNested" v-slot:expanded-item="{ headers }">
        <td :colspan="headers.length" class="pr-0">
          <component
            :is="childInterfaceComponent"
            class="mb-2"
            :record-info="expandTypeObject.recordInfo"
            :icon="expandTypeObject.icon"
            :title="expandTypeObject.name"
            :hidden-headers="expandTypeObject.excludeHeaders"
            :locked-filters="lockedSubFilters"
            :page-options="subPageOptions"
            :hidden-filters="hiddenSubFilters"
            is-child-component
            :dense="dense"
            @pageOptions-updated="handleSubPageOptionsUpdated"
            @record-changed="reset({ resetExpanded: false })"
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
    <EditRecordDialog
      :status="dialogs.editRecord"
      :record-info="recordInfo"
      :selected-item="dialogs.selectedItem"
      :mode="dialogs.editMode"
      @close="dialogs.editRecord = false"
      @handleSubmit="handleListChange()"
      @item-updated="handleListChange()"
    ></EditRecordDialog>
    <v-dialog v-model="dialogs.expandRecord">
      <v-card flat>
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
          :dense="dense"
          @pageOptions-updated="handleSubPageOptionsUpdated"
          @record-changed="reset({ resetExpanded: false })"
        >
          <template v-slot:header-action>
            <v-btn icon @click="dialogs.expandRecord = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </component>
      </v-card>
    </v-dialog>
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
