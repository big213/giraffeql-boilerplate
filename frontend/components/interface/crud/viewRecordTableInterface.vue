<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'max-height': dialogMode }" class="pt-3 px-0">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <div v-else>
        <div v-if="currentItem && recordInfo.viewOptions.heroOptions">
          <component
            v-if="recordInfo.viewOptions.heroOptions.component"
            :is="recordInfo.viewOptions.heroOptions.component"
            :item="currentItem"
            :record-info="recordInfo"
          ></component>
          <v-img
            v-else
            :src="
              recordInfo.viewOptions.heroOptions.getPreviewImage
                ? recordInfo.viewOptions.heroOptions.getPreviewImage(
                    currentItem
                  )
                : currentItem.avatar
            "
            class="white--text align-end"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            height="200px"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-icon size="200" color="grey darken-3">{{
                  recordInfo.icon
                }}</v-icon>
              </v-row>
            </template>

            <v-card-title class="subheading font-weight-bold"
              >{{
                recordInfo.viewOptions.heroOptions.getPreviewName
                  ? recordInfo.viewOptions.heroOptions.getPreviewName(
                      currentItem
                    )
                  : currentItem.name
              }}
            </v-card-title>
          </v-img>
        </div>
        <v-container class="text-left py-0">
          <v-simple-table>
            <template v-slot:default>
              <tbody>
                <tr v-for="(item, i) in visibleInputsArray" :key="i">
                  <td
                    v-if="renderVerticalView(item)"
                    colspan="2"
                    class="pb-3 truncate"
                  >
                    <div class="pt-3 subtitle-2 text-decoration-underline">
                      {{ item.fieldInfo.text }}
                    </div>
                    <component
                      :is="item.fieldInfo.component"
                      v-if="item.fieldInfo.component"
                      :item="currentItem"
                      :field-path="getFieldPath(item)"
                      :options="item.fieldInfo.columnOptions"
                      @submit="$emit('handleSubmit')"
                      @item-updated="handleItemUpdated()"
                    ></component>
                    <span v-else class="break-space">{{
                      getNestedProperty(currentItem, item.field)
                    }}</span>
                  </td>
                  <td v-if="!renderVerticalView(item)" style="width: 150px">
                    <span class="subtitle-2">{{ item.fieldInfo.text }}</span>
                  </td>
                  <td v-if="!renderVerticalView(item)" class="truncate">
                    <component
                      :is="item.fieldInfo.component"
                      v-if="item.fieldInfo.component"
                      :item="currentItem"
                      :field-path="getFieldPath(item)"
                      :options="item.fieldInfo.columnOptions"
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
        <v-divider class="mx-3"></v-divider>
        <component
          v-if="recordInfo.postOptions"
          :is="postInterface"
          :locked-filters="postLockedFilters"
          :record-info="recordInfo.postOptions.recordInfo"
          :generation="postsGeneration"
        ></component>
      </div>
    </v-card-text>
    <v-card-actions v-if="!isLoading">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
    </v-card-actions>
  </v-card>
</template>

<script>
import { executeGiraffeql } from '~/services/giraffeql'
import CrudPostInterface from '~/components/interface/crud/crudPostInterface.vue'
import {
  getNestedProperty,
  handleError,
  capitalizeString,
  serializeNestedProperty,
  lookupFieldInfo,
  processQuery,
} from '~/services/base'
import CircularLoader from '~/components/common/circularLoader.vue'

export default {
  components: {
    CircularLoader,
  },
  data() {
    return {
      loading: {
        loadRecord: false,
      },

      postsGeneration: 0,
      resetCalledOnTick: false,

      currentItem: null,

      inputsArray: [],
    }
  },

  props: {
    selectedItem: {
      type: Object,
      required: true,
    },

    recordInfo: {
      type: Object,
      required: true,
    },

    // must be add, edit, view, or copy
    mode: {
      type: String,
      required: true,
      validator: (value) => {
        return ['add', 'edit', 'view', 'copy'].includes(value)
      },
    },

    // in dialog mode, some changes are made in the component, like max-height
    dialogMode: {
      type: Boolean,
      default: false,
    },

    generation: {
      type: Number,
      default: 0,
    },
  },

  computed: {
    isLoading() {
      return this.loading.loadRecord
    },

    capitalizedType() {
      return capitalizeString(this.recordInfo.typename)
    },

    postInterface() {
      return this.recordInfo.postOptions?.component ?? CrudPostInterface
    },

    postLockedFilters() {
      return [
        {
          field: this.recordInfo.typename,
          operator: 'eq',
          value: this.selectedItem.id,
        },
      ]
    },

    visibleInputsArray() {
      // if hideIf is specified, check if the input should be visible
      return this.inputsArray.filter((inputObject) => {
        const hideIf = inputObject.fieldInfo.tableOptions?.hideIf

        if (hideIf) {
          return !hideIf(inputObject.value, this.currentItem)
        }

        return true
      })
    },
  },

  watch: {
    generation() {
      // also need to reset the posts, if any
      this.reset(true)
    },

    recordInfo() {
      this.reset(true)
    },
  },

  created() {
    this.reset(true)

    this.$root.$on('refresh-interface', this.refreshCb)
  },

  destroyed() {
    this.$root.$off('refresh-interface', this.refreshCb)
  },

  methods: {
    getNestedProperty,

    refreshCb(typename) {
      if (this.recordInfo.typename === typename) {
        this.reset(true)
      }
    },

    renderVerticalView(inputObject) {
      return inputObject.fieldInfo.tableOptions?.verticalView
    },

    getFieldPath(inputObject) {
      const primaryField = inputObject.fieldInfo.fields
        ? inputObject.fieldInfo.fields[0]
        : inputObject.field

      return (
        inputObject.fieldInfo.pathPrefix ??
        (inputObject.fieldInfo.fields && inputObject.fieldInfo.fields.length > 1
          ? null
          : primaryField)
      )
    },

    handleItemUpdated() {
      this.$emit('item-updated')
      this.reset(true)
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        const fields = this.recordInfo.viewOptions.fields

        const { query, serializeMap } = processQuery(
          this,
          this.recordInfo,
          fields.concat(this.recordInfo.requiredFields ?? [])
        )
        const data = await executeGiraffeql(this, {
          ['get' + this.capitalizedType]: {
            ...query,
            __args: {
              id: this.selectedItem.id,
            },
          },
        })

        // save record
        this.currentItem = data

        // remove any undefined serializeMap elements
        serializeMap.forEach((val, key) => {
          if (val === undefined) serializeMap.delete(key)
        })

        // apply serialization to results
        serializeMap.forEach((serialzeFn, field) => {
          serializeNestedProperty(data, field, serialzeFn)
        })

        // run any custom onSuccess functions
        const onSuccess = this.recordInfo.viewOptions.onSuccess

        if (onSuccess) {
          onSuccess(this, data)
        }

        // build inputs Array
        this.inputsArray = await Promise.all(
          fields.map((fieldKey) => {
            const fieldInfo = lookupFieldInfo(this.recordInfo, fieldKey)

            const fieldValue = fieldInfo.hidden
              ? null
              : getNestedProperty(data, fieldKey)

            const inputObject = {
              field: fieldInfo.fields ? fieldInfo.fields[0] : fieldKey,
              fieldInfo,
              value: fieldValue, // already serialized
              options: [],
              readonly: true,
              generation: 0,
            }

            return inputObject
          })
        )
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadRecord = false
    },

    reset(resetPosts = false) {
      // if reset was already called on this tick, stop execution
      if (this.resetCalledOnTick) return

      // indicate that reset was called on this tick
      this.resetCalledOnTick = true

      // reset the indicator on the next tick
      this.$nextTick(() => {
        this.resetCalledOnTick = false
      })

      this.loadRecord()

      if (resetPosts) {
        this.postsGeneration++
      }
    },
  },
}
</script>

<style scoped>
.max-height {
  max-height: 600px;
}
</style>
