<template>
  <v-card flat class="elevation-1">
    <v-card-title class="pa-0" style="display: block">
      <v-container
        v-if="parentExpandTypesComputed && parentExpandTypesComputed.length > 1"
        class="mx-0 text-center"
        fluid
      >
        <v-row justify="center" no-gutters>
          <v-col
            v-for="expandTypeObject in parentExpandTypesComputed"
            :key="expandTypeObject.key"
            cols="12"
            sm="3"
          >
            <v-card
              class="ma-2 text-center"
              outlined
              @click="handleParentExpandTypeUpdated(expandTypeObject)"
            >
              <v-img
                height="75px"
                :src="null"
                :class="
                  currentExpandTypeKey === expandTypeObject.key
                    ? 'selected-element'
                    : null
                "
              >
                <v-layout column justify-center align-center fill-height>
                  <v-card-title>{{ expandTypeObject.name }}</v-card-title>
                </v-layout>
              </v-img>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <v-container
        v-if="!hidePresets && hasPresetFilters"
        fluid
        class="mx-0 text-center"
      >
        <v-row justify="center" class="mt-3">
          <v-col
            v-if="
              viewDefinition.paginationOptions.searchOptions &&
              viewDefinition.paginationOptions.searchOptions.preset
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
              :input-object="crudFilterObject.inputObject"
              :key="i"
              style="font-weight: initial"
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
      <div v-if="visibleChipsFiltersArray.length" class="py-2">
        <div
          v-for="(crudFilterObject, i) in visibleChipsFiltersArray"
          :key="i"
          class="text-center pb-2"
        >
          <div
            v-if="crudFilterObject.inputObject.options.length"
            class="mb-2 title"
          >
            {{ crudFilterObject.filterInputFieldDefinition.text }}
          </div>
          <div>
            <v-chip
              :color="
                crudFilterObject.inputObject.value === null ? 'green' : null
              "
              @click.stop="applyChipFilter(crudFilterObject.inputObject, null)"
              >Show All</v-chip
            >
            |
            <component
              :is="
                crudFilterObject.filterInputFieldDefinition.chipOptions
                  .component || 'PreviewRecordChip'
              "
              v-for="(inputOption, j) in crudFilterObject.inputObject.options"
              :key="j"
              :value="inputOption"
              class="mr-2"
              :color="
                crudFilterObject.inputObject.value === inputOption.id
                  ? 'green'
                  : null
              "
              @click.stop="
                applyChipFilter(crudFilterObject.inputObject, inputOption)
              "
            ></component>
          </div>
        </div>
      </div>

      <v-container
        v-if="breadcrumbMode && !hideBreadcrumbs && breadcrumbItems.length"
        fluid
        class="px-0"
      >
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

      <v-toolbar
        v-if="!viewDefinition.paginationOptions.hideToolbar"
        flat
        color="accent"
        dense
      >
        <v-btn
          v-if="breadcrumbItems.length - 1 > 0"
          icon
          title="Up one level"
          @click="goUpOneLevel()"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

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
        <v-icon v-if="!viewDefinition.paginationOptions.hideTitle" left>{{
          icon || viewDefinition.entity.icon || 'mdi-domain'
        }}</v-icon>
        <v-toolbar-title v-if="!viewDefinition.paginationOptions.hideTitle">{{
          elementTitle ||
          viewDefinition.title ||
          viewDefinition.entity.pluralName
        }}</v-toolbar-title>
        <v-divider
          v-if="viewDefinition.createOptions && !hideCreateButton"
          class="mx-4"
          inset
          vertical
        ></v-divider>
        <v-btn
          v-if="viewDefinition.createOptions && !hideCreateButton"
          color="primary"
          @click="openCreateRecordDialog()"
        >
          <v-icon left>mdi-plus</v-icon>
          New
        </v-btn>
        <v-divider
          v-if="viewDefinition.generateOptions && !hideGenerateButton"
          class="mx-4"
          inset
          vertical
        ></v-divider>
        <v-btn
          v-if="viewDefinition.generateOptions && !hideGenerateButton"
          color="primary"
          @click="openGenerateRecordDialog()"
        >
          <v-icon left
            >{{ viewDefinition.generateOptions.buttonIcon ?? 'mdi-plus' }}
          </v-icon>
          {{ viewDefinition.generateOptions.buttonText ?? 'Generate' }}
        </v-btn>
        <v-divider
          v-if="viewDefinition.paginationOptions.searchOptions"
          class="mx-4"
          inset
          vertical
        ></v-divider>
        <SearchDialog
          v-if="viewDefinition.paginationOptions.searchOptions"
          v-model="searchInput"
          @handleSubmit="handleSearchDialogSubmit"
        >
          <template slot="icon">
            <v-badge :value="!!search" dot color="secondary" title="Search">
              <v-icon>mdi-magnify</v-icon>
            </v-badge>
          </template>
        </SearchDialog>
        <v-chip v-if="search" class="ml-2"
          >{{ search }}
          <v-icon right color="pink" @click.stop="handleSearchDialogSubmit()"
            >mdi-close</v-icon
          >
        </v-chip>
        <v-spacer></v-spacer>
        <v-btn
          v-if="viewDefinition.paginationOptions.showViewAll"
          text
          @click="handleViewAllButtonClick"
        >
          View All
        </v-btn>
        <v-menu
          v-if="
            sortFields.length &&
            !viewDefinition.paginationOptions.hideSortOptions
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
                currentSortObject ? currentSortObject.text : 'None'
              }}</span></v-btn
            >
          </template>
          <v-list dense>
            <v-list-item
              v-for="sortObject in sortFields"
              :key="sortObject.key"
              :class="{ 'selected-bg': currentSortObject === sortObject }"
              @click="setCurrentSortOption(sortObject)"
            >
              <v-list-item-title>{{ sortObject.text }}</v-list-item-title>
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
          v-if="!viewDefinition.paginationOptions.hideGridModeToggle"
          icon
          title="Toggle Grid/List Mode"
          @click="toggleGridMode()"
        >
          <v-icon>{{ isGrid ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
        </v-btn>
        <v-btn
          v-if="viewDefinition.paginationOptions.importOptions"
          icon
          title="Import Records"
          @click="openImportRecordDialog()"
        >
          <v-icon>mdi-upload</v-icon>
        </v-btn>
        <v-btn
          v-if="viewDefinition.paginationOptions.downloadOptions"
          icon
          title="Download Records"
          :loading="loading.exportData"
          @click="exportData()"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
        <v-btn
          v-if="!viewDefinition.paginationOptions.hideRefresh"
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
            v-if="viewDefinition.paginationOptions.searchOptions"
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
            :lg="crudFilterObject.inputObject.cols ?? 3"
            class="py-0"
          >
            <GenericInput
              :input-object="crudFilterObject.inputObject"
              :key="i"
              style="font-weight: initial"
              @change="updatePageOptions"
              @handle-input="filterChanged = true"
            ></GenericInput>
          </v-col>
          <v-col
            v-for="(distanceFilterObject, i) in distanceFilterOptions"
            :key="`${i}-d`"
            cols="12"
            class="py-0"
          >
            <v-container fluid>
              <v-row>
                <v-col cols="3" class="py-0">
                  <v-text-field
                    v-model="distanceFilterObject.ltValue"
                    :label="`Distance Less Than - ${distanceFilterObject.definition.text}`"
                    outlined
                    clearable
                    @keyup.enter="updatePageOptions()"
                    @input="filterChanged = true"
                  ></v-text-field>
                </v-col>
                <v-col cols="3" class="py-0">
                  <v-text-field
                    v-model="distanceFilterObject.gtValue"
                    :label="`Distance Greater Than - ${distanceFilterObject.definition.text}`"
                    outlined
                    clearable
                    @keyup.enter="updatePageOptions()"
                    @input="filterChanged = true"
                  ></v-text-field>
                </v-col>
                <v-col cols="3" class="py-0">
                  <v-text-field
                    v-model="distanceFilterObject.latitudeValue"
                    :label="`Latitude - ${distanceFilterObject.definition.text}`"
                    outlined
                    clearable
                    @keyup.enter="updatePageOptions()"
                    @input="filterChanged = true"
                  ></v-text-field>
                </v-col>
                <v-col cols="3" class="py-0">
                  <v-text-field
                    v-model="distanceFilterObject.longitudeValue"
                    :label="`Longitude - ${distanceFilterObject.definition.text}`"
                    outlined
                    clearable
                    @keyup.enter="updatePageOptions()"
                    @input="filterChanged = true"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
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
    </v-card-title>
    <v-card-text
      :class="{
        'dialog-max-height': isDialog,
      }"
      class="pa-0"
    >
      <div
        v-if="!viewDefinition.paginationOptions.hideCount"
        class="text-center"
      >
        <span v-if="isDataLoading">...</span>
        <span v-else-if="!totalRecords">---</span>
        <span v-else class="noselect">
          (Showing {{ records.length }} of {{ totalRecords }}
          {{ viewDefinition.entity.pluralName }})
        </span>
      </div>
      <v-divider />
      <slot name="header-text"></slot>
      <v-data-iterator
        v-if="isGrid"
        :items="records"
        disable-sort
        disable-pagination
        hide-default-footer
        class="pt-5"
        :style="
          viewDefinition.paginationOptions.minHeight
            ? `min-height: ${viewDefinition.paginationOptions.minHeight}`
            : null
        "
        :loading="loading.loadData"
      >
        <template v-slot:loading>
          <CircularLoader
            v-if="viewDefinition.paginationOptions.loaderStyle === 'circular'"
            :style="
              viewDefinition.paginationOptions.minHeight
                ? `min-height: ${viewDefinition.paginationOptions.minHeight}`
                : null
            "
          ></CircularLoader>
          <v-progress-linear v-else indeterminate></v-progress-linear>
        </template>
        <template v-slot:default="props">
          <v-container fluid>
            <v-row
              :justify="
                viewDefinition.paginationOptions.gridOptions &&
                viewDefinition.paginationOptions.gridOptions.justify
              "
            >
              <v-col
                v-for="item in props.items"
                :key="item.id"
                v-bind="gridColsObject"
                cols="12"
              >
                <v-card
                  class="noselect elevation-6"
                  @click="handleGridElementClick(item)"
                >
                  <div v-if="viewDefinition.paginationOptions.heroOptions">
                    <component
                      :is="heroComponent"
                      :item="item"
                      :hero-options="
                        viewDefinition.paginationOptions.heroOptions
                      "
                      :entity="viewDefinition.entity"
                    ></component>
                  </div>
                  <v-list dense>
                    <v-list-item v-for="(headerObject, j) in headers" :key="j">
                      <v-list-item-content v-if="!headerObject.hideTitleIfGrid"
                        >{{ headerObject.text }}:</v-list-item-content
                      >
                      <v-list-item-content
                        :class="{ 'text-right': !headerObject.hideTitleIfGrid }"
                      >
                        <FieldColumn
                          :render-object="headerObject"
                          :item="item"
                          display-mode="crud"
                          @edit-item="openEditItemDialog"
                        />
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                  <div
                    v-for="(expandObject, i) in renderedExpandItems"
                    :key="i"
                  >
                    <v-btn
                      v-if="isShowExpandButton(item, expandObject)"
                      block
                      class="mt-1"
                      @click.stop="toggleGridExpand(item, expandObject)"
                    >
                      <v-icon left>{{
                        expandObject.icon ?? expandObject.view.entity.icon
                      }}</v-icon>
                      {{ expandObject.name ?? expandObject.view.entity.name }}
                    </v-btn>
                  </div>

                  <div
                    v-if="!viewDefinition.paginationOptions.hideActions"
                    class="text-center"
                    style="width: 100%"
                  >
                    <v-divider />
                    <RecordActionMenu
                      :view-definition="viewDefinition"
                      :item="item"
                      expand-mode="emit"
                      bottom
                      offset-y
                      :btn-attrs="{ block: true, text: true }"
                      @handle-action-click="openEditDialog"
                      @handle-expand-click="toggleGridExpand(item, $event)"
                      @handle-custom-action-click="handleCustomActionClick"
                    >
                      <template v-slot:btn-content> Actions </template>
                    </RecordActionMenu>
                  </div>
                </v-card>
              </v-col>
              <v-col
                v-if="
                  !viewDefinition.paginationOptions.hideViewMoreOptions &&
                  records.length < totalRecords
                "
                cols="12"
                class="text-center pa-0"
              >
                <v-divider></v-divider>
                <v-btn
                  text
                  block
                  :loading="loading.loadMore"
                  @click="loadMore()"
                  >View More</v-btn
                >
              </v-col>
              <v-col
                v-if="!viewDefinition.paginationOptions.hideCount"
                cols="12"
                class="text-center pa-0"
              >
                <v-divider></v-divider>
                <span v-if="isDataLoading">...</span>
                <span v-else-if="!totalRecords">---</span>
                <span v-else class="noselect">
                  (Showing {{ records.length }} of {{ totalRecords }}
                  {{ viewDefinition.entity.pluralName }})
                </span>
              </v-col>
            </v-row>
          </v-container>
        </template>
        <template v-slot:no-data
          ><div class="text-center">
            No {{ viewDefinition.entity.pluralName }}
          </div></template
        >
      </v-data-iterator>
      <v-data-table
        v-else
        :headers="headers"
        :items="records"
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
              v-for="(headerObject, i) in headers"
              :key="i"
              class="v-data-table__mobile-row"
            >
              <div
                v-if="
                  headerObject.fieldKey === null &&
                  !viewDefinition.paginationOptions.hideActions
                "
                class="text-center"
                style="width: 100%"
              >
                <v-divider />
                <RecordActionMenu
                  :view-definition="viewDefinition"
                  :item="props.item"
                  expand-mode="emit"
                  bottom
                  offset-y
                  :btn-attrs="{ block: true, text: true }"
                  @handle-action-click="openEditDialog"
                  @handle-expand-click="toggleItemExpanded(props, $event)"
                  @handle-custom-action-click="handleCustomActionClick"
                >
                  <template v-slot:btn-content> Actions </template>
                </RecordActionMenu>
              </div>
              <template v-else>
                <div class="v-data-table__mobile-row__header">
                  {{ headerObject.text }}
                </div>
                <div class="v-data-table__mobile-row__cell truncate-mobile-row">
                  <FieldColumn
                    :render-object="headerObject"
                    :item="props.item"
                    display-mode="crud"
                    @edit-item="openEditItemDialog"
                  />
                </div>
              </template>
            </td>
          </tr>
          <tr
            v-else
            :key="props.item.id"
            :class="{
              'expanded-row-bg': props.isExpanded,
              'pointer-cursor':
                !!viewDefinition.paginationOptions.handleRowClick,
            }"
            @click="handleRowClick(props)"
          >
            <td
              v-for="(headerObject, i) in headers"
              :key="i"
              :class="headerObject.align ? `text-${headerObject.align}` : null"
              class="truncate"
            >
              <div v-if="headerObject.fieldKey === null">
                <RecordActionMenu
                  :view-definition="viewDefinition"
                  :item="props.item"
                  expand-mode="emit"
                  left
                  offset-x
                  :btn-attrs="{ small: true }"
                  @handle-action-click="openEditDialog"
                  @handle-expand-click="toggleItemExpanded(props, $event)"
                  @handle-custom-action-click="handleCustomActionClick"
                >
                  <template v-slot:btn-content>
                    <v-icon small>mdi-dots-vertical</v-icon>
                  </template>
                </RecordActionMenu>
              </div>
              <FieldColumn
                v-else
                :render-object="headerObject"
                :item="props.item"
                display-mode="crud"
                @edit-item="openEditItemDialog"
              />
            </td>
          </tr>
        </template>
        <template v-slot:footer>
          <div
            v-if="
              !viewDefinition.paginationOptions.hideViewMoreOptions &&
              records.length < totalRecords
            "
            class="text-center"
          >
            <v-divider></v-divider>
            <v-btn text block :loading="loading.loadMore" @click="loadMore()"
              >View More</v-btn
            >
          </div>
          <div
            v-if="!viewDefinition.paginationOptions.hideCount"
            class="text-center"
          >
            <v-divider></v-divider>
            <span v-if="isDataLoading">...</span>
            <span v-else-if="!totalRecords">---</span>
            <span v-else class="noselect">
              (Showing {{ records.length }} of {{ totalRecords }}
              {{ viewDefinition.entity.pluralName }})
            </span>
          </div>
        </template>

        <template
          v-if="hasNested"
          v-slot:expanded-item="{ headers, item, isMobile }"
        >
          <td :colspan="headers.length" class="pr-0">
            <div class="mb-2 expanded-table-bg">
              <component
                :is="childInterfaceComponent"
                :view-definition="expandTypeObject.view"
                :icon="expandTypeObject.icon"
                :element-title="expandTypeObject.name"
                :hidden-headers="hiddenSubHeaders"
                :locked-filters="lockedSubFilters"
                :page-options="subPageOptions"
                :hidden-filters="hiddenSubFilters"
                is-child-component
                :parent-item="expandedItem"
                :dense="dense"
                :breadcrumb-items="subBreadcrumbItems"
                :results-per-page="expandTypeObject.resultsPerPage"
                :hide-presets="!expandTypeObject.showPresets"
                :parent-expand-types="viewDefinition.childTypes"
                :current-expand-type-key="expandTypeObject.key"
                @parent-expand-type-updated="
                  toggleItemExpanded(
                    { item, isMobile, isExpanded: true },
                    $event
                  )
                "
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
            </div>
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
      :view-definition="viewDefinition"
      :parent-item="dialogs.parentItem ?? parentItem"
      :locked-fields="dialogs.lockedFields"
      :mode="dialogs.editMode"
      :custom-fields="dialogs.customFields"
      @reload-parent="reset({ resetExpanded: true })"
      @reload-parent-item="$emit('reload-parent-item')"
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
        :view-definition="expandTypeObject.view"
        :icon="expandTypeObject.icon"
        :element-title="expandTypeObject.name"
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
