<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'dialog-max-height': dialogMode }" class="px-0 pt-0">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <div v-else>
        <div v-if="currentItem && recordInfo.viewOptions.heroOptions">
          <component
            :is="heroComponent"
            :item="currentItem"
            :record-info="recordInfo"
            mode="view"
          ></component>
        </div>
        <v-container class="text-left py-0">
          <v-simple-table>
            <template v-slot:default>
              <tbody>
                <tr v-for="(item, i) in visibleInputsArray" :key="i">
                  <td v-if="item.verticalMode" colspan="2" class="pb-3">
                    <div class="pt-3 subtitle-2 text-decoration-underline">
                      {{ item.fieldInfo.text }}
                    </div>
                    <component
                      :is="item.fieldInfo.component"
                      v-if="item.fieldInfo.component"
                      :item="currentItem"
                      :field-path="getFieldPath(item)"
                      :options="item.fieldInfo.columnOptions"
                      display-mode="view"
                      @submit="$emit('handleSubmit')"
                      @item-updated="handleItemUpdated()"
                    ></component>
                    <span v-else class="break-space">{{
                      getNestedProperty(currentItem, item.field)
                    }}</span>
                  </td>
                  <td v-if="!item.verticalMode" style="width: 150px">
                    <span class="subtitle-2">{{ item.fieldInfo.text }}</span>
                  </td>
                  <td v-if="!item.verticalMode">
                    <component
                      :is="item.fieldInfo.component"
                      v-if="item.fieldInfo.component"
                      :item="currentItem"
                      :field-path="getFieldPath(item)"
                      :options="item.fieldInfo.columnOptions"
                      display-mode="view"
                      @submit="$emit('handleSubmit')"
                      @item-updated="handleItemUpdated()"
                    ></component>
                    <span v-else class="break-space">{{
                      getNestedProperty(currentItem, item.field)
                    }}</span>
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
