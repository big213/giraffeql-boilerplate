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
} from '~/services/base'
import { processInputObjectArray } from '~/services/base'

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

    visibleSecondaryActions() {
      return (this.actionDefinition.secondaryActions ?? []).filter(
        (secondaryActionDefintion) =>
          !secondaryActionDefintion.showIf ||
          secondaryActionDefintion.showIf(this, this.parentItem)
      )
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
      return setInputValue(this, this.parentItem, this.inputsArray, key, value)
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

    async handleSecondaryActionSubmit(secondaryActionDefinition) {
      this.loading.executeAction = true
      try {
        const args = await processInputObjectArray(
          this,
          this.parentItem,
          this.inputsArray
        )

        await secondaryActionDefinition.onSubmit(this, this.parentItem, args)

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
      if (!this.actionDefinition.persistent) {
        if (this.dialogMode) {
          this.$emit('close')
        } else {
          // else reset
          this.reset()
        }
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
        // if actionDefinition.getInitialFields, fetch the initialField
        const initialFields = await this.actionDefinition.getInitialFields?.(
          this,
          this.parentItem
        )

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
                inputObject.fieldKey in this.lockedFields &&
                this.lockedFields[inputObject.fieldKey] !== undefined
              ) {
                inputObject.value = this.lockedFields[inputObject.fieldKey]
                inputObject.readonly = true

                // if fieldInfo.hideIfLocked, also set those fields to hidden
                if (actionFieldDefinition.hideIfLocked) {
                  inputObject.hidden = true
                }
              } else if (
                initialFields &&
                inputObject.fieldKey in initialFields &&
                initialFields[inputObject.fieldKey] !== undefined
              ) {
                // assumes the initialFields is a flattened array (i.e. dot notation -- different from editRecordDialog.js)
                inputObject.value = initialFields[inputObject.fieldKey]
              } else {
                inputObject.value =
                  (await actionFieldDefinition.inputDefinition.getInitialValue?.(
                    this,
                    this.parentItem
                  )) ?? null
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
