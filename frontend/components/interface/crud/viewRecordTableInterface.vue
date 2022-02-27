<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'max-height': dialogMode }" class="pt-3">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <v-container v-else class="text-left">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left" style="width: 150px">Name</th>
                <th class="text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in inputsArray" :key="i">
                <td>{{ item.fieldInfo.text }}</td>
                <td>
                  <component
                    :is="item.fieldInfo.component"
                    v-if="item.fieldInfo.component"
                    :item="currentItem"
                    :field-path="getFieldPath(item)"
                    :options="item.fieldInfo.columnOptions"
                    @submit="$emit('handleSubmit')"
                    @item-updated="handleItemUpdated()"
                  ></component>
                  <span v-else style="white-space: break-spaces">{{
                    getNestedProperty(currentItem, item.field)
                  }}</span>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-container>
      <component
        v-if="recordInfo.commentOptions"
        :is="recordInfo.commentOptions.component"
        :item="selectedItem"
        :record-info="recordInfo.commentOptions.recordInfo"
        :generation="commentsGeneration"
      ></component>
    </v-card-text>
    <v-card-actions v-if="!isLoading">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
    </v-card-actions>
  </v-card>
</template>

<script>
import { executeGiraffeql } from '~/services/giraffeql'
import {
  getNestedProperty,
  handleError,
  collapseObject,
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

      commentsGeneration: 0,

      inputsArray: [],
    }
  },

  props: {
    selectedItem: {
      type: Object,
      default: () => ({}),
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
  },

  watch: {
    generation() {
      // also need to reset the comments, if any
      this.commentsGeneration++
      this.reset()
    },

    recordInfo() {
      this.reset()
    },
  },

  mounted() {
    this.reset()
  },

  methods: {
    getNestedProperty,

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
      this.commentsGeneration++
      this.reset()
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        const fields = this.recordInfo.viewOptions.fields

        const { query, serializeMap } = processQuery(
          this,
          this.recordInfo,
          fields
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

    reset() {
      this.loadRecord()
    },
  },
}
</script>

<style scoped>
.max-height {
  max-height: 600px;
}
</style>
