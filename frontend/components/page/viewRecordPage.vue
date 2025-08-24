<template>
  <v-container v-if="loading.loadRecord || !currentItem" fill-height>
    <v-layout align-center justify-center>
      <div v-if="loading.loadRecord">
        <span class="display-1 pl-2"
          >Loading...
          <v-progress-circular indeterminate></v-progress-circular>
        </span>
      </div>
      <div v-else>
        <span class="display-1 pl-2"
          >{{ viewDefinition.entity.name }} Not Found</span
        >
      </div>
    </v-layout>
  </v-container>
  <v-container v-else fluid>
    <v-layout justify-center align-center column d-block>
      <v-row>
        <v-col v-if="recordMode === 'minimized'" cols="12">
          <PreviewRecordChip :value="currentItem">
            <template v-slot:rightIcon>
              <RecordActionMenu
                v-if="!viewDefinition.pageOptions?.hideActions"
                :view-definition="viewDefinition"
                :item="currentItem"
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
              :parent-item="currentItem"
              :view-definition="viewDefinition"
              :generation="generation"
              :reset-instruction="recordResetInstruction"
              mode="view"
            >
              <template v-slot:toolbar>
                <v-toolbar flat color="accent" dense>
                  <v-icon left>{{
                    viewDefinition.entity.icon || 'mdi-domain'
                  }}</v-icon>
                  <v-toolbar-title>
                    {{ viewDefinition.entity.name }}
                  </v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="!showComments && hasComments"
                    icon
                    @click="toggleComments()"
                  >
                    <v-icon>mdi-comment</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="!viewDefinition.pageOptions?.hideRefresh"
                    icon
                    @click="reset()"
                  >
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="viewDefinition.pageOptions?.dedicatedShareButton"
                    icon
                    @click="openEditDialog({ mode: 'share' })"
                  >
                    <v-icon>mdi-share-variant</v-icon></v-btn
                  >
                  <RecordActionMenu
                    v-if="!viewDefinition.pageOptions?.hideActions"
                    :view-definition="viewDefinition"
                    :item="currentItem"
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
                    v-if="!viewDefinition.pageOptions?.hideMinimize"
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
            :hidden-fields="viewDefinition.postOptions.hiddenFields"
            :view-definition="viewDefinition.postOptions.viewDefinition"
            :page-options="initialPostPageOptions"
            :initial-sort-key="viewDefinition.postOptions.initialSortKey"
            :readonly="viewDefinition.postOptions.readonly"
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
              :view-definition="expandTypeObject.view"
              :element-title="expandTypeObject.name"
              :icon="expandTypeObject.icon"
              :hidden-headers="hiddenSubHeaders"
              :locked-filters="lockedSubFilters"
              :page-options="isChildComponent ? subPageOptions : pageOptions"
              :hidden-filters="hiddenSubFilters"
              :hide-presets="!expandTypeObject.showPresets"
              :parent-item="parentItem"
              :breadcrumb-mode="!!expandTypeObject.breadcrumbOptions"
              :hide-breadcrumbs="
                expandTypeObject?.breadcrumbOptions?.hideBreadcrumbs
              "
              :breadcrumb-items="breadcrumbItems"
              :is-child-component="isChildComponent"
              dense
              :parent-expand-types="viewDefinition.childTypes"
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
            :view-definition="item.expandTypeObject.view"
            :icon="item.expandTypeObject.icon"
            :hidden-headers="getHiddenSubFilters(item.expandTypeObject)"
            :locked-filters="getHiddenSubHeaders(item.expandTypeObject)"
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
      :view-definition="viewDefinition"
      :parent-item="currentItem"
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
