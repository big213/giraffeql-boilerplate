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
import { executeApiRequest } from '~/services/api'
import {
  capitalizeString,
  handleError,
  buildQueryFromFieldPathArray,
} from '~/services/base'

export default {
  props: {
    parentItem: {
      type: Object,
      required: true,
    },
    viewDefinition: {
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
      return this.viewDefinition.entity.nameField
        ? this.parentItem[this.viewDefinition.entity.nameField]
        : this.parentItem.id
    },
  },

  methods: {
    async deleteRecord() {
      this.loading.deleteRecord = true
      try {
        const data = await executeApiRequest({
          [this.viewDefinition.deleteOptions.operationName ??
          `${this.viewDefinition.entity.typename}Delete`]: {
            id: true,
            ...(this.viewDefinition.deleteOptions.returnFields
              ? buildQueryFromFieldPathArray(
                  this.viewDefinition.updateOptions.returnFields
                )
              : undefined),
            __args: {
              id: this.parentItem.id,
            },
          },
        })

        this.$root.$emit('showSnackbar', {
          message: `${this.viewDefinition.entity.name}Deleted`,
          color: 'success',
        })

        // run any custom onSuccess functions
        const onSuccess = this.viewDefinition.deleteOptions.onSuccess

        if (onSuccess) {
          onSuccess(this, data)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit(
            'refresh-interface',
            this.viewDefinition.entity.typename
          )
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
