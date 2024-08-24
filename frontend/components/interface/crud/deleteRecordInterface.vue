<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text class="py-0 mt-3">
      <v-alert type="error">
        Confirm Delete{{ itemIdentifier ? ': ' + itemIdentifier : '' }}
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        color="error"
        text
        :loading="loading.deleteRecord"
        @click="deleteRecord()"
        >Delete</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { executeGiraffeql } from '~/services/giraffeql'
import {
  capitalizeString,
  handleError,
  buildQueryFromFieldPathArray,
} from '~/services/base'

export default {
  props: {
    selectedItem: {
      type: Object,
      required: true,
    },
    recordInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: {
        deleteRecord: false,
      },
    }
  },

  computed: {
    // default to name || id
    itemIdentifier() {
      return this.recordInfo.renderItem
        ? this.recordInfo.renderItem(this.selectedItem)
        : this.selectedItem.name || this.selectedItem.id
    },
  },

  methods: {
    async deleteRecord() {
      this.loading.deleteRecord = true
      try {
        const data = await executeGiraffeql({
          [this.recordInfo.deleteOptions.operationName ??
          `delete${capitalizeString(this.recordInfo.typename)}`]: {
            id: true,
            ...(this.recordInfo.deleteOptions.returnFields
              ? buildQueryFromFieldPathArray(
                  this.recordInfo.editOptions.returnFields
                )
              : undefined),
            __args: {
              id: this.selectedItem.id,
            },
          },
        })

        this.$notifier.showSnackbar({
          message: `${this.recordInfo.name}Deleted`,
          variant: 'success',
        })

        // run any custom onSuccess functions
        const onSuccess = this.recordInfo.deleteOptions.onSuccess

        if (onSuccess) {
          onSuccess(this, data)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit('refresh-interface', this.recordInfo.typename)
        }

        this.$emit('handleSubmit', data)
        this.$emit('close')
      } catch (err) {
        handleError(this, err)
      }
      this.loading.deleteRecord = false
    },
  },
}
</script>
