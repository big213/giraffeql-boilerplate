<template>
  <v-container v-if="loading.loadRecord || !selectedItem" fill-height>
    <v-layout align-center justify-center>
      <div v-if="loading.loadRecord">
        <span class="display-1 pl-2"
          >Loading...
          <v-progress-circular indeterminate></v-progress-circular>
        </span>
      </div>
      <div v-else>
        <span class="display-1 pl-2">{{ recordInfo.name }} Not Found</span>
      </div>
    </v-layout>
  </v-container>
  <v-container v-else fluid>
    <v-layout justify-center align-center column d-block>
      <v-row>
        <v-col v-if="recordMode === 'minimized'" cols="12">
          <PreviewRecordChip :value="selectedItem">
            <template v-slot:rightIcon>
              <RecordActionMenu
                v-if="!hideActions"
                :record-info="recordInfo"
                :item="selectedItem"
                hide-enter
                expand-mode="emit"
                left
                offset-x
                :btn-attrs="{ icon: true, small: true }"
                @handle-action-click="openEditDialog"
                @handle-custom-action-click="handleCustomActionClick"
                @handle-expand-click="handleExpandClick"
              >
                <template v-slot:btn-content>
                  <v-icon>mdi-dots-vertical</v-icon>
                </template>
              </RecordActionMenu>
              <v-btn icon small>
                <v-icon @click="toggleRecordMinimized(false)"
                  >mdi-arrow-expand</v-icon
                >
              </v-btn>
              <v-btn icon small>
                <v-icon @click="openViewRecordDialog()">mdi-information</v-icon>
              </v-btn>
            </template>
          </PreviewRecordChip>
        </v-col>
        <v-col
          v-else-if="recordMode === 'show'"
          cols="12"
          :md="fullPageMode ? 12 : isExpanded && !showComments ? 4 : 6"
          :offset-md="fullPageMode ? 0 : isExpandOrCommentsOpened ? 0 : 3"
        >
          <v-card class="elevation-12">
            <component
              :is="currentInterface"
              :selected-item="selectedItem"
              :record-info="recordInfo"
              :generation="generation"
              :reset-instruction="recordResetInstruction"
              mode="view"
            >
              <template v-slot:toolbar>
                <v-toolbar flat color="accent" dense>
                  <v-icon left>{{ recordInfo.icon || 'mdi-domain' }}</v-icon>
                  <v-toolbar-title>
                    {{ recordInfo.name }}
                  </v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="!showComments && hasComments"
                    icon
                    @click="toggleComments()"
                  >
                    <v-icon>mdi-comment</v-icon>
                  </v-btn>
                  <v-btn v-if="!hideRefresh" icon @click="reset()">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="recordInfo.pageOptions?.dedicatedShareButton"
                    icon
                    @click="openEditDialog('share')"
                  >
                    <v-icon>mdi-share-variant</v-icon></v-btn
                  >
                  <RecordActionMenu
                    v-if="!hideActions"
                    :record-info="recordInfo"
                    :item="selectedItem"
                    hide-view
                    hide-enter
                    expand-mode="emit"
                    left
                    offset-x
                    :btn-attrs="{ icon: true }"
                    @handle-action-click="openEditDialog"
                    @handle-custom-action-click="handleCustomActionClick"
                    @handle-expand-click="handleExpandClick"
                  >
                    <template v-slot:btn-content>
                      <v-icon>mdi-dots-vertical</v-icon>
                    </template>
                  </RecordActionMenu>
                  <v-btn
                    v-if="!hideMinimize"
                    icon
                    @click="toggleRecordMinimized(true)"
                  >
                    <v-icon>mdi-arrow-collapse</v-icon>
                  </v-btn>
                </v-toolbar>
              </template>
            </component>
          </v-card>
        </v-col>
        <v-col
          v-if="hasComments && showComments"
          cols="12"
          :md="fullPageMode ? 12 : isExpanded && !showComments ? 12 : 6"
          class="text-center"
        >
          <component
            class="mx-auto elevation-6"
            style="max-width: 800px"
            :is="postInterface"
            :locked-filters="postLockedFilters"
            :hidden-fields="recordInfo.postOptions.hiddenFields"
            :record-info="recordInfo.postOptions.recordInfo"
            :initial-sort-options="recordInfo.postOptions.initialSortOptions"
          >
            <template v-slot:header-action>
              <v-btn icon @click="toggleComments(false)">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </component>
        </v-col>
        <v-col
          v-if="isExpanded"
          cols="12"
          :md="
            fullPageMode ? 12 : recordMode === 'show' && !showComments ? 8 : 12
          "
        >
          <v-card class="elevation-12">
            <component
              :is="paginationComponent"
              :record-info="expandTypeObject.recordInfo"
              :element-title="expandTypeObject.name"
              :icon="expandTypeObject.icon"
              :hidden-headers="expandTypeObject.excludeHeaders"
              :locked-filters="lockedSubFilters"
              :page-options="isChildComponent ? subPageOptions : pageOptions"
              :hidden-filters="hiddenSubFilters"
              :hide-presets="!expandTypeObject.showPresets"
              :parent-item="parentItem"
              :breadcrumb-mode="!!expandTypeObject.breadcrumbOptions"
              :hide-breadcrumbs="hideBreadcrumbs"
              :breadcrumb-items="breadcrumbItems"
              :is-child-component="isChildComponent"
              dense
              :parent-expand-types="recordInfo.expandTypes"
              :current-expand-type-key="expandTypeObject.key"
              @pageOptions-updated="handleSubPageOptionsUpdated"
              @parent-expand-type-updated="handleExpandClick"
              @reload-parent-item="handleReloadParentItem()"
              @expand-type-updated="handleExpandTypeUpdated"
              @breadcrumb-item-click="handleBreadcrumbItemClick"
              @replace-breadcrumb-item="replaceBreadcrumbItem"
            >
              <template
                v-slot:header-action
                v-if="recordMode !== 'hidden' || isChildComponent"
              >
                <v-btn icon @click="toggleExpand(null)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>
            </component>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-for="(item, i) in previewExpandTypes" :key="i">
        <v-col cols="12">
          <component
            :is="getExpandTypeComponent(item.expandTypeObject)"
            :record-info="item.expandTypeObject.recordInfo"
            :icon="item.expandTypeObject.icon"
            :hidden-headers="item.expandTypeObject.excludeHeaders"
            :locked-filters="getExpandTypeSubFilters(item.expandTypeObject)"
            :page-options="item.pageOptions"
            :hidden-filters="
              getExpandTypeHiddenSubFilters(item.expandTypeObject)
            "
            :hide-presets="!item.expandTypeObject.showPresets"
            :parent-item="parentItem"
            dense
            @pageOptions-updated="item.pageOptions = $event"
          >
          </component>
        </v-col>
      </v-row>
    </v-layout>
    <EditRecordDialog
      v-model="dialogs.editRecord"
      :record-info="recordInfo"
      :selected-item="selectedItem"
      :mode="dialogs.editMode"
      @close="dialogs.editRecord = false"
      @handle-submit="handleSubmit"
    ></EditRecordDialog>
  </v-container>
</template>

<script>
import viewRecordPageMixin from '~/mixins/viewRecordPage'

export default {
  mixins: [viewRecordPageMixin],
}
</script>
