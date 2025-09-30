<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'dialog-max-height': dialogMode }" class="pt-3">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <div v-show="!isLoading">
        <div
          v-if="actionDefinition.previewOptions"
          class="selected-element mb-5"
        >
          <ViewRecordInterface
            :parent-item="parentItem"
            :view-definition="actionDefinition.previewOptions.viewDefinition"
            :override-options="actionDefinition.previewOptions.viewOptions"
            mode="view"
            :generation="previewGeneration"
          >
          </ViewRecordInterface>
          <v-divider></v-divider>
        </div>
        <v-container v-show="visibleInputsArray.length" class="px-0">
          <v-row>
            <v-col
              v-for="(inputObject, i) in visibleInputsArray"
              :key="i"
              :cols="inputObject.cols || 12"
              class="py-0"
            >
              <GenericInput
                v-show="!inputObject.hidden"
                :input-object="inputObject"
                :parent-item="parentItem"
                :all-items="inputsArray"
                :key="i"
                ref="inputs"
                @handle-submit="handleSubmit()"
              ></GenericInput>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-card-text>

    <v-card-actions v-if="!isLoading && !hideActions">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        ref="submit"
        color="primary"
        :loading="loading.executeAction"
        @click="handleSubmit()"
        >{{ submitButtonText }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import CircularLoader from '~/components/common/circularLoader.vue'
import GenericInput from '~/components/input/genericInput.vue'
import ViewRecordInterface from '~/components/interface/crud/viewRecordInterface.vue'
import { executeApiRequest } from '~/services/api'
import {
  collapseObject,
  handleError,
  populateInputObject,
  timeout,
  setInputValue,
  getInputValue,
  getInputObject,
  generateInputObject,
  addNestedInputObject,
} from '~/services/base'
import { processInputObjectArray } from '../../../services/base'

export default {
  components: {
    CircularLoader,
    GenericInput,
    ViewRecordInterface,
  },
  props: {
    parentItem: {
      type: Object,
    },

    lockedFields: {
      type: Object,
    },

    // type: ActionDefinition
    actionDefinition: {
      type: Object,
      required: true,
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

  data() {
    return {
      inputsArray: [],

      previewGeneration: 0,

      loading: {
        executeAction: false,
        initInputs: false,
      },
    }
  },

  computed: {
    isLoading() {
      return Object.values(this.loading).some((state) => state)
    },
    visibleInputsArray() {
      return this.inputsArray.filter(
        (inputObject) =>
          !inputObject.hideIf ||
          !inputObject.hideIf(this, this.parentItem, this.inputsArray)
      )
    },

    submitButtonText() {
      return this.actionDefinition.submitButtonText ?? 'Submit'
    },

    hideActions() {
      return !!this.actionDefinition.hideActionsIf?.(this, this.parentItem)
    },
  },

  watch: {
    generation() {
      // if generation changes, reset all inputs
      this.reset()
    },
  },

  created() {
    this.reset()

    window.addEventListener('beforeunload', this.onBeforeUnload)
  },

  methods: {
    onBeforeUnload(e) {
      // if currently importing, have a warning alert when navigating away from page
      if (this.loading.executeAction) {
        e.preventDefault()
        e.returnValue = ''
        return
      }

      delete e['returnValue']
    },

    setInputValue(key, value) {
      return setInputValue(this.inputsArray, key, value)
    },

    getInputValue(key) {
      return getInputValue(this.inputsArray, key, false)
    },

    getInputObject(key) {
      return getInputObject(this.inputsArray, key)
    },

    handleParentItemUpdated(item, lockedFields) {
      this.$emit('handle-parent-item-updated', item, {
        ...this.lockedFields,
        ...lockedFields,
      })
    },

    async handleSubmit() {
      this.loading.executeAction = true
      try {
        // trigger beforeSubmit logic on genericInputs
        const inputs = [...(this.$refs.inputs ?? [])]
        for (const input of inputs) {
          await input.beforeSubmit()
        }

        // if any inputs are loading, wait 500 ms and check again before proceeding
        while (
          this.inputsArray.some((inputObject) => inputObject.loading === true)
        ) {
          // sleep 500 ms before checking again
          await timeout(500)
        }

        const args = await processInputObjectArray(
          this,
          this.parentItem,
          this.inputsArray
        )

        // do additional modification of the inputs object, if required
        if (this.actionDefinition.argsModifier) {
          this.actionDefinition.argsModifier(this, this.parentItem, args)
        }

        if (this.actionDefinition.operationName) {
          const query = {
            [this.actionDefinition.operationName]: {
              ...this.actionDefinition.getReturnQuery?.(this, this.parentItem),
              __args: collapseObject(args),
            },
          }

          // max 1 attempt, in case of some weird edge cases with firebase functions that could result in the request going through multiple times
          const data = await executeApiRequest(query, {
            maxAttempts: 1,
          })
          this.handleSubmitSuccess(data)
        } else if (this.actionDefinition.onSubmit) {
          // if no operationName, must have onSubmit function
          const data = await this.actionDefinition.onSubmit(
            this,
            this.parentItem,
            args
          )
          this.handleSubmitSuccess(data)
        } else {
          throw new Error('Misconfigured action')
        }

        // reset inputs
        // this.resetInputs()
      } catch (err) {
        handleError(this, err)
      }
      this.loading.executeAction = false
    },

    handleSubmitSuccess(data) {
      // if persistent and there are previewOptions, then refresh the contents of the preview
      if (
        this.actionDefinition.persistent &&
        this.actionDefinition.previewOptions
      ) {
        this.previewGeneration++
      }

      // if it's not persistent, close (if there is a dialog)
      if (!this.actionDefinition.persistent && this.dialogMode) {
        this.$emit('close')
      } else {
        // else reset
        this.reset()
      }

      this.$emit('handle-submit', data)

      // run any custom onSuccess functions. if none, simply show a snackbar
      const onSuccess = this.actionDefinition.onSuccess
      if (onSuccess) {
        onSuccess(this, this.parentItem, data)
      } else {
        this.$root.$emit('showSnackbar', {
          message: `Action: ${this.actionDefinition.title} completed successfully`,
          color: 'success',
        })
      }
    },

    async initializeInputs() {
      // set loading state until all inputs are done loading
      this.loading.initInputs = true
      try {
        this.inputsArray = await Promise.all(
          this.actionDefinition.fields
            .filter(
              (input) =>
                !input.excludeIf?.(this, this.parentItem, this.lockedFields)
            )
            .map(async (actionFieldDefinition) => {
              const inputObject = generateInputObject(
                this,
                actionFieldDefinition
              )

              // is the field in lockedFields? if so, use that and set field to readonly
              if (
                this.lockedFields &&
                inputObject.fieldPath in this.lockedFields &&
                this.lockedFields[inputObject.fieldPath] !== undefined
              ) {
                inputObject.value = this.lockedFields[inputObject.fieldPath]
                inputObject.readonly = true

                // if fieldInfo.hideIfLocked, also set those fields to hidden
                if (actionFieldDefinition.hideIfLocked) {
                  inputObject.hidden = true
                }
              } else {
                inputObject.value =
                  (await actionFieldDefinition.inputDefinition.getInitialValue?.(
                    this,
                    this.parentItem
                  )) ?? null
              }

              // if it is an array, populate the nestedInputsArray
              if (inputObject.inputDefinition.inputType === 'value-array') {
                if (Array.isArray(inputObject.value)) {
                  inputObject.value.forEach((ele) =>
                    addNestedInputObject(
                      this,
                      inputObject,
                      this.parentItem,
                      ele
                    )
                  )
                }
              }

              // populate inputObjects if we need to translate any IDs to objects, and also populate any options
              await Promise.all(
                populateInputObject(this, {
                  inputObject,
                  parentItem: this.parentItem,
                  fetchEntities: true,
                })
              )

              return inputObject
            })
        )

        // add the watchers *after* initial inputs finished loading
        this.inputsArray.forEach((inputObject) => {
          // should there be a watcher on this input?
          if (inputObject.watch) {
            this.$watch(
              function () {
                return this.getInputValue(inputObject.fieldKey)
              },
              function (val, prev) {
                return inputObject.watch(this, val, prev)
              }
            )
          }
        })

        this.loading.initInputs = false
      } catch (err) {
        // if there is an error, keep the loading state
        handleError(this, err)
      }

      // this.loading.initInputs = false
    },

    reset() {
      this.initializeInputs()
    },
  },

  destroyed() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
  },
}
</script>
