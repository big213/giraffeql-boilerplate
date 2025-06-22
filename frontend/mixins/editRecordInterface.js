import { executeApiRequest } from '~/services/api'
import {
  collapseObject,
  getNestedProperty,
  handleError,
  setInputValue,
  getInputValue,
  getInputObject,
  populateInputObject,
  processInputQuery,
  timeout,
  buildQueryFromFieldPathArray,
  generateInputObject,
  addNestedInputObject,
  processInputDefinitions,
  processInputObjectArray,
} from '~/services/base'
import GenericInput from '~/components/input/genericInput.vue'
import CircularLoader from '~/components/common/circularLoader.vue'

export default {
  components: {
    GenericInput,
    CircularLoader,
  },
  props: {
    lockedFields: {},

    parentItem: {},

    viewDefinition: {
      type: Object,
      required: true,
    },

    // custom fields that will override add/edit/view options on viewDefinition
    customFields: {
      type: Array,
    },

    // must be add, edit, view, or copy
    mode: {
      type: String,
      required: true,
      validator: (value) => {
        return ['create', 'update', 'view', 'copy'].includes(value)
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

    // additional fields to hide
    hiddenFields: {
      type: Array,
      default: () => [],
    },

    // the fields to return with handleSubmit, if any
    returnFields: {
      type: Object,
    },
  },
  data() {
    return {
      inputsArray: [],

      // inputs that are used for scaffolding
      miscInputs: null,
      originalMiscInputs: {},

      // loaded from loadMiscDropdowns, if provided
      miscOptions: {},

      currentItem: null,

      loading: {
        editRecord: false,
        loadRecord: false,
        initInputs: false,
        loadDropdowns: false,
      },

      resetCalledOnTick: false,

      submitGeneration: 0,
    }
  },

  computed: {
    isLoading() {
      return Object.values(this.loading).some((state) => state)
    },

    fields() {
      if (this.customFields) return this.customFields

      // for edit, fields could be a dynamic function
      if (
        this.mode === 'update' &&
        typeof this.viewDefinition.updateOptions.fields === 'function'
      ) {
        return this.viewDefinition.updateOptions.fields(this, this.parentItem)
      }

      return this.viewDefinition[`${this.mode}Options`].fields
    },

    title() {
      return (
        (this.mode === 'create' || this.mode === 'copy'
          ? 'New'
          : this.mode === 'update'
          ? 'Update'
          : 'View') +
        ' ' +
        this.viewDefinition.entity.name
      )
    },
    icon() {
      return this.mode === 'create' || this.mode === 'copy'
        ? 'mdi-plus'
        : this.mode === 'update'
        ? 'mdi-pencil'
        : 'mdi-eye'
    },

    visibleInputsArray() {
      return this.inputsArray.filter((inputObject) => {
        if (inputObject.hideIf)
          return !inputObject.hideIf(this, this.parentItem, this.inputsArray)

        return true
      })
    },
  },

  watch: {
    lockedFields() {
      this.reset()
    },
    generation() {
      this.reset()
    },
    viewDefinition() {
      this.reset()
    },
  },

  created() {
    this.reset()
    this.$root.$on('refresh-interface', this.refreshCb)
  },

  destroyed() {
    this.$root.$off('refresh-interface', this.refreshCb)
  },

  methods: {
    refreshCb(typename, { refreshType } = {}) {
      // only allow refresh on view mode
      // if type of refresh is not defined or 'update', refresh
      if (
        this.viewDefinition.entity.typename === typename &&
        this.mode === 'view' &&
        (!refreshType || refreshType === 'update')
      ) {
        this.reset()
      }
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

    handleFileAdded(inputObject, fileRecord) {
      if (inputObject.handleFileAdded) {
        inputObject.handleFileAdded(
          this,
          this.inputsArray,
          inputObject,
          fileRecord
        )
      }
    },

    async handleSubmit() {
      this.loading.editRecord = true
      try {
        // trigger beforeSubmit logic on genericInputs
        for (const input of this.$refs.inputs) {
          await input.beforeSubmit()
        }

        // if any inputs are loading, wait 500 ms and check again before proceeding
        while (
          this.inputsArray.some((inputObject) => inputObject.loading === true)
        ) {
          // sleep 500 ms before checking again
          await timeout(500)
        }

        const inputs = await processInputObjectArray(this, this.inputsArray)

        // add/copy mode
        let data
        if (this.mode === 'create' || this.mode === 'copy') {
          // run the inputsModifier, if any
          if (this.viewDefinition.createOptions.inputsModifier) {
            this.viewDefinition.createOptions.inputsModifier(this, inputs)
          }

          data = await executeApiRequest(
            {
              [this.viewDefinition.createOptions.operationName ??
              `${this.viewDefinition.entity.typename}Create`]: {
                id: true,
                __typename: true,
                ...this.returnFields,
                ...(this.viewDefinition.createOptions.returnFields
                  ? buildQueryFromFieldPathArray(
                      this.viewDefinition.createOptions.returnFields
                    )
                  : undefined),
                __args: collapseObject(inputs),
              },
            },
            {
              maxAttempts: 1, // at most 1 attempt at a time for create operations
            }
          )
        } else {
          // run the inputsModifier, if any
          if (this.viewDefinition.updateOptions.inputsModifier) {
            this.viewDefinition.updateOptions.inputsModifier(this, inputs)
          }

          data = await executeApiRequest({
            [this.viewDefinition.updateOptions.operationName ??
            `${this.viewDefinition.entity.typename}Update`]: {
              id: true,
              __typename: true,
              ...this.returnFields,
              ...(this.viewDefinition.updateOptions.returnFields
                ? buildQueryFromFieldPathArray(
                    this.viewDefinition.updateOptions.returnFields
                  )
                : undefined),
              __args: {
                item: {
                  id: this.parentItem.id,
                },
                fields: collapseObject(inputs),
              },
            },
          })
        }

        this.$root.$emit('showSnackbar', {
          message: `${this.viewDefinition.entity.name} ${
            this.mode === 'create' || this.mode === 'copy'
              ? 'Created'
              : 'Updated'
          }`,
          color: 'success',
        })

        this.handleSubmitSuccess(data)

        // reset inputs
        this.resetInputs()
      } catch (err) {
        handleError(this, err)
      }
      this.loading.editRecord = false
    },

    handleSubmitSuccess(data) {
      this.$emit('close')
      this.$emit('handle-submit', data)

      // run any custom onSuccess functions
      if (
        this.mode === 'create' ||
        this.mode === 'update' ||
        this.mode === 'copy'
      ) {
        const onSuccess = this.viewDefinition[`${this.mode}Options`].onSuccess

        if (onSuccess) {
          onSuccess(this, this.parentItem, data)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit(
            'refresh-interface',
            this.viewDefinition.entity.typename
          )
        }
      }
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        const originalInputFieldDefinitions = processInputDefinitions(
          this.viewDefinition,
          this.fields
        )

        const query = await processInputQuery(originalInputFieldDefinitions)

        const data = await executeApiRequest({
          [`${this.viewDefinition.entity.typename}Get`]: {
            ...query,
            __args: {
              id: this.parentItem.id,
            },
          },
        })

        // save record
        this.currentItem = data

        // keep track of promises relating to dropdowns/options
        const dropdownPromises = []

        // for copy mode, use the createOption fields. else use the original fields
        const inputFieldDefinitions =
          this.mode === 'copy'
            ? processInputDefinitions(
                this.viewDefinition,
                this.viewDefinition.createOptions.fields
              )
            : originalInputFieldDefinitions

        // build inputs Array
        this.inputsArray = await Promise.all(
          inputFieldDefinitions.map(async (inputFieldDefinition) => {
            const inputObject = generateInputObject(this, inputFieldDefinition)

            // if copy mode and fieldKey not in original fields, use default
            if (
              this.mode === 'copy' &&
              !originalInputFieldDefinitions.some(
                (inputFieldDefinition) =>
                  inputFieldDefinition.fieldKey === inputObject.fieldKey
              )
            ) {
              inputObject.value =
                (await inputObject.inputDefinition.getInitialValue?.(
                  this,
                  this.parentItem
                )) ?? null
            } else {
              inputObject.value = getNestedProperty(data, inputObject.fieldKey)
            }

            // if it is an array, populate the nestedInputsArray
            if (inputObject.inputDefinition.inputType === 'value-array') {
              if (Array.isArray(inputObject.value)) {
                inputObject.value.forEach((ele) =>
                  addNestedInputObject(this, inputObject, this.parentItem, ele)
                )
              }
            }

            // if it is an entity, populate the value and options fields
            if (inputObject.inputDefinition.entity) {
              inputObject.value = getNestedProperty(data, inputObject.fieldKey)

              // if the value is defined and there is no getOptions fn, populate it as the only option
              if (
                inputObject.value &&
                !inputObject.inputDefinition.getOptions
              ) {
                inputObject.options = [inputObject.value]
              }
            }

            // populate inputObjects if we need to translate any IDs to objects, and also populate any options
            dropdownPromises.push(
              ...populateInputObject(this, {
                inputObject,
                parentItem: this.parentItem,
                fetchEntities: this.mode !== 'update',
              })
            )

            return inputObject
          })
        )

        // do post-processing on inputsArray, if function provided
        if (this.mode === 'update') {
          this.viewDefinition.updateOptions.afterLoaded &&
            (await this.viewDefinition.updateOptions.afterLoaded(
              this,
              this.inputsArray
            ))
        } else if (this.mode === 'copy') {
          this.viewDefinition.createOptions.afterLoaded &&
            (await this.viewDefinition.createOptions.afterLoaded(
              this,
              this.inputsArray
            ))
        }
        // wait for all dropdown-related promises to complete
        await Promise.all(dropdownPromises)

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
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadRecord = false
    },

    async loadDropdowns() {
      this.loading.loadDropdowns = true

      // load any other misc dropdowns
      this.loadMiscDropdowns && (await this.loadMiscDropdowns())

      this.loading.loadDropdowns = false
    },

    resetInputs(excludeKeys = []) {
      this.inputsArray.forEach(async (inputObject) => {
        // skip any fieldKeys that should be excluded
        if (excludeKeys.includes(inputObject.fieldKey)) return

        // check lockedFields, and reset the value of such fields
        if (this.lockedFields && inputObject.fieldPath in this.lockedFields) {
          inputObject.value = this.lockedFields[inputObject.fieldPath]
        } else {
          inputObject.value =
            (await inputObject.inputDefinition.getInitialValue?.(
              this,
              this.parentItem
            )) ?? null
        }

        // increment inputObject.generation to reset inputs, if necessary
        inputObject.generation++
      })
    },

    async initializeInputs() {
      // set loading state until all inputs are done loading
      this.loading.initInputs = true
      try {
        if (!this.fields) {
          throw new Error('Creation of this record is not configured')
        }

        const inputFieldDefinitions = processInputDefinitions(
          this.viewDefinition,
          this.fields
        )

        this.inputsArray = await Promise.all(
          inputFieldDefinitions.map(async (inputFieldDefinition) => {
            const inputObject = generateInputObject(this, inputFieldDefinition)

            // if there are hiddenFields, check if this is one of them
            if (this.hiddenFields.includes(inputObject.fieldKey)) {
              inputObject.hidden = true
            }

            // is the field in lockedFields? if so, use that and set field to readonly
            if (
              this.lockedFields &&
              inputObject.fieldPath in this.lockedFields &&
              this.lockedFields[inputObject.fieldPath] !== undefined
            ) {
              inputObject.value = this.lockedFields[inputObject.fieldPath]
              inputObject.readonly = true

              // if createFieldDefinition.hideIfLocked, also set those fields to hidden
              if (inputFieldDefinition.hideIfLocked) {
                inputObject.hidden = true
              }
            } else {
              inputObject.value =
                (await inputObject.inputDefinition.getInitialValue?.(
                  this,
                  this.parentItem
                )) ?? null
            }

            // if it is an array, populate the nestedInputsArray
            if (inputObject.inputDefinition.inputType === 'value-array') {
              if (Array.isArray(inputObject.value)) {
                inputObject.value.forEach((ele) =>
                  addNestedInputObject(this, inputObject, this.parentItem, ele)
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

    // function to be called after inputs are initialized
    afterInitializeInputs() {},

    async reset() {
      // if reset was already called on this tick, stop execution
      if (this.resetCalledOnTick) return

      // indicate that reset was called on this tick
      this.resetCalledOnTick = true

      // reset the indicator on the next tick
      this.$nextTick(() => {
        this.resetCalledOnTick = false
      })

      // duplicate misc inputs, if any
      this.miscInputs = JSON.parse(JSON.stringify(this.originalMiscInputs))

      // load dropdowns
      this.loadDropdowns()

      // set all loading to false (could have been stuck from previous operations)
      for (const prop in this.loading) {
        this.loading[prop] = false
      }

      // initialize inputs
      if (this.mode === 'create') {
        await this.initializeInputs()
        // do post-processing on inputsArray, if function provided
        this.viewDefinition.createOptions.afterLoaded &&
          (await this.viewDefinition.createOptions.afterLoaded(
            this,
            this.inputsArray
          ))
        this.afterInitializeInputs && this.afterInitializeInputs()
      } else {
        this.loadRecord()
      }
    },
  },
}
