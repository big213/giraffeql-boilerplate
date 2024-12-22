<template>
  <v-card flat>
    <v-toolbar dense flat color="accent" class="mb-3">
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
      <v-icon left>{{ viewDefinition.entity.icon }}</v-icon>
      <v-toolbar-title>
        <span
          >{{ viewDefinition.entity.pluralName }} ({{
            loading.loadMore ? '--' : totalRecords
          }})</span
        >
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon :loading="loading.loadMore" @click="reset()">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <slot name="header-action"></slot>
    </v-toolbar>
    <v-card-text
      :class="{
        'dialog-max-height': isDialog,
      }"
      class="pa-0"
    >
      <v-container class="text-left">
        <v-row>
          <v-col v-if="viewDefinition.createOptions" cols="12">
            <div class="highlighted-bg">
              <EditRecordInterface
                :view-definition="viewDefinition"
                mode="create"
                :selected-item="selectedItem"
                hide-locked-fields
                :hidden-fields="hiddenFields"
                @handle-submit="handlePostSubmit()"
              ></EditRecordInterface>
            </div>
          </v-col>
          <v-col v-for="props in records" :key="props.item.id" cols="12">
            <v-card
              class="elevation-5"
              :color="$vuetify.theme.dark ? 'grey darken-3' : 'grey lighten-3'"
            >
              <v-list-item>
                <v-list-item-avatar>
                  <v-img
                    v-if="props.item.createdBy.avatarUrl"
                    class="elevation-6"
                    :alt="props.item.createdBy.name"
                    :src="props.item.createdBy.avatarUrl"
                  ></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <PreviewRecordMenu
                    :item="props.item.createdBy"
                    :typename="props.item.createdBy.__typename"
                    :close-on-content-click="false"
                    :min-width="300"
                    :max-width="300"
                    offset-y
                    top
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-list-item-title v-bind="attrs" v-on="on">{{
                        props.item.createdBy.name
                      }}</v-list-item-title>
                    </template>
                  </PreviewRecordMenu>
                  <v-list-item-subtitle>{{
                    generateTimeAgoString(props.item.createdAt)
                  }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-row
                  v-if="
                    viewDefinition.updateOptions || viewDefinition.deleteOptions
                  "
                  align="center"
                  justify="end"
                >
                  <v-menu bottom left>
                    <template v-slot:activator="{ on }">
                      <v-btn icon v-on="on">
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list dense>
                      <v-list-item
                        v-if="viewDefinition.updateOptions"
                        key="edit"
                        @click="props.isEditing = true"
                      >
                        <v-list-item-icon>
                          <v-icon>mdi-pencil</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Edit</v-list-item-title>
                      </v-list-item>
                      <v-list-item
                        v-if="viewDefinition.deleteOptions"
                        key="delete"
                        @click="deletePost(props)"
                      >
                        <v-list-item-icon>
                          <v-icon>mdi-delete</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Delete</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-row>
              </v-list-item>
              <v-card-text class="body-1 pt-0">
                <template v-if="!props.isEditing">
                  <span class="break-space">{{ props.item.content }}</span>
                  <PreviewableFilesColumn
                    v-if="props.item.files.length"
                    :item="props.item"
                    field-path="files"
                  ></PreviewableFilesColumn>
                </template>
                <EditRecordInterface
                  v-else
                  :view-definition="viewDefinition"
                  mode="update"
                  :selected-item="props.item"
                  :return-fields="returnFields"
                  @handle-submit="handlePostUpdate(props, $event)"
                >
                  <v-btn
                    text
                    slot="footer-action"
                    @click="props.isEditing = false"
                    >Cancel</v-btn
                  >
                </EditRecordInterface>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row v-if="loading.loadMore">
          <CircularLoader style="min-height: 250px"></CircularLoader>
        </v-row>
        <v-row v-else>
          <v-col cols="12" class="text-center">
            <div v-if="records.length < totalRecords">
              <v-btn @click="loadMorePosts()">Load More</v-btn>
            </div>
            <span v-if="loading.loadMore">...</span>
            <span v-else-if="!totalRecords">---</span>
            <span v-else>
              (Showing {{ records.length }} of {{ totalRecords }}
              {{ viewDefinition.entity.pluralName }})
            </span>
          </v-col>

          <v-col v-if="records.length < 1" cols="12" class="text-center"
            >No {{ viewDefinition.entity.pluralName }}</v-col
          >
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions v-if="isDialog">
      <slot name="footer-action"></slot>
    </v-card-actions>
  </v-card>
</template>

<script>
import crudPostInterfaceMixin from '~/mixins/crudPostInterface'

export default {
  mixins: [crudPostInterfaceMixin],
}
</script>
