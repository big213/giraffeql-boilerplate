<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'dialog-max-height': dialogMode }" class="px-0 pt-0">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <div v-else>
        <div v-if="currentItem && viewDefinition.viewOptions.heroOptions">
          <component
            :is="heroComponent"
            :item="currentItem"
            :hero-options="viewDefinition.viewOptions.heroOptions"
            :entity="viewDefinition.entity"
          ></component>
        </div>
        <v-container class="text-left py-0">
          <v-simple-table>
            <template v-slot:default>
              <tbody>
                <tr
                  v-for="(viewObject, i) in visibleRenderFieldsArray"
                  :key="i"
                >
                  <td v-if="viewObject.verticalMode" colspan="2" class="pb-3">
                    <div class="pt-3 subtitle-2 text-decoration-underline">
                      {{ viewObject.text }}
                    </div>
                    <FieldColumn
                      :render-object="viewObject"
                      :item="currentItem"
                      display-mode="view"
                      @edit-item="openEditItemDialog"
                    />
                  </td>
                  <td v-if="!viewObject.verticalMode" style="width: 150px">
                    <span class="subtitle-2">{{ viewObject.text }}</span>
                  </td>
                  <td v-if="!viewObject.verticalMode">
                    <FieldColumn
                      :render-object="viewObject"
                      :item="currentItem"
                      display-mode="view"
                      @edit-item="openEditItemDialog"
                    />
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-container>
        <slot name="posts"></slot>
      </div>
    </v-card-text>
    <v-card-actions v-if="!isLoading">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
    </v-card-actions>
  </v-card>
</template>

<script>
import viewRecordInterfaceMixin from '~/mixins/viewRecordInterface'

export default {
  mixins: [viewRecordInterfaceMixin],
}
</script>
