import { executeGiraffeql } from '~/services/giraffeql'
import {
  collapseObject,
  getNestedProperty,
  capitalizeString,
  handleError,
  serializeNestedProperty,
  setInputValue,
  getInputValue,
  getInputObject,
  populateInputObject,
  lookupFieldInfo,
  addNestedInputObject,
  processInputObject,
  processQuery,
  timeout,
  buildQueryFromFieldPathArray,
} from '~/services/base'
import GenericInput from '~/components/input/genericInput.vue'
import CircularLoader from '~/components/common/circularLoader.vue'

export default {
  components: {
    GenericInput,
    CircularLoader,
  },
  props: {
    // only required for edit mode
    selectedItem: {
      type: Object,
    },

    recordInfo: {
      type: Object,
      required: true,
    },

    // custom fields that will override add/edit/view options on recordInfo
    customFields: {
      type: Array,
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

    // to hide any fields that are locked via selectedItem
    hideLockedFields: {
      type: Boolean,
      default: false,
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
      return this.customFields ?? this.recordInfo[`${this.mode}Options`].fields
    },

    // extracts the field from any EditFieldDefinitions
    rawFields() {
      if (!this.fields) return []

      return this.fields.map((fieldElement) =>
        typeof fieldElement === 'string' ? fieldElement : fieldElement.field
      )
    },

    capitalizedType() {
      return capitalizeString(this.recordInfo.typename)
    },
    title() {
      return (
        (this.mode === 'add' || this.mode === 'copy'
          ? 'New'
          : this.mode === 'edit'
          ? 'Edit'
          : 'View') +
        ' ' +
        this.recordInfo.name
      )
    },
    icon() {
      return this.mode === 'add' || this.mode === 'copy'
        ? 'mdi-plus'
        : this.mode === 'edit'
        ? 'mdi-pencil'
        : 'mdi-eye'
    },

    visibleInputsArray() {
      return this.inputsArray.filter((inputObject) => {
        if (inputObject.hidden) return false

        if (inputObject.hideIf)
          return !inputObject.hideIf(this, this.inputsArray)

        return true
      })
    },
  },

  watch: {
    selectedItem() {
      this.reset()
    },
    generation() {
      this.reset()
    },
    recordInfo() {
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
      // if type of refresh is not defined or 'edit', refresh
      if (
        this.recordInfo.typename === typename &&
        this.mode === 'view' &&
        (!refreshType || refreshType === 'edit')
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

        const inputs = {}

        for (const inputObject of this.inputsArray) {
          inputs[inputObject.primaryField] = await processInputObject(
            this,
            inputObject,
            this.inputsArray
          )
        }

        // add/copy mode
        let data
        if (this.mode === 'add' || this.mode === 'copy') {
          // run the inputsModifier, if any
          if (this.recordInfo.addOptions.inputsModifier) {
            this.recordInfo.addOptions.inputsModifier(this, inputs)
          }

          data = await executeGiraffeql(
            {
              [this.recordInfo.addOptions.operationName ??
              `create${this.capitalizedType}`]: {
                id: true,
                __typename: true,
                ...this.returnFields,
                ...(this.recordInfo.addOptions.returnFields
                  ? buildQueryFromFieldPathArray(
                      this.recordInfo.addOptions.returnFields
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
          if (this.recordInfo.editOptions.inputsModifier) {
            this.recordInfo.editOptions.inputsModifier(this, inputs)
          }

          data = await executeGiraffeql({
            [this.recordInfo.editOptions.operationName ??
            `update${this.capitalizedType}`]: {
              id: true,
              __typename: true,
              ...this.returnFields,
              ...(this.recordInfo.editOptions.returnFields
                ? buildQueryFromFieldPathArray(
                    this.recordInfo.editOptions.returnFields
                  )
                : undefined),
              __args: {
                item: {
                  id: this.selectedItem.id,
                },
                fields: collapseObject(inputs),
              },
            },
          })
        }

        this.$notifier.showSnackbar({
          message: `${this.recordInfo.name} ${
            this.mode === 'add' || this.mode === 'copy' ? 'Added' : 'Updated'
          }`,
          variant: 'success',
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
      if (this.mode === 'add' || this.mode === 'edit' || this.mode === 'copy') {
        const onSuccess = this.recordInfo[`${this.mode}Options`].onSuccess

        if (onSuccess) {
          onSuccess(this, data)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit('refresh-interface', this.recordInfo.typename)
        }
      }
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        const { serializeMap, query } = await processQuery(
          this,
          this.recordInfo,
          this.rawFields
        )

        const data = await executeGiraffeql({
          [`get${this.capitalizedType}`]: {
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

        // if copy mode, load all add fields
        const inputFields =
          this.mode === 'copy' ? this.recordInfo.addOptions.fields : this.fields

        // keep track of promises relating to dropdowns/options
        const dropdownPromises = []

        // build inputs Array
        this.inputsArray = await Promise.all(
          inputFields.map(async (fieldElement) => {
            const fieldKey =
              typeof fieldElement === 'string'
                ? fieldElement
                : fieldElement.field

            const fieldInfo = lookupFieldInfo(this.recordInfo, fieldKey)

            const primaryField = fieldInfo.fields
              ? fieldInfo.fields[0]
              : fieldKey

            const inputObject = {
              fieldKey,
              primaryField,
              fieldInfo,
              recordInfo: this.recordInfo,
              inputType: fieldInfo.inputType,
              label: fieldInfo.text ?? fieldKey,
              hint: fieldInfo.hint,
              clearable: true,
              closeable: false,
              optional: fieldInfo.optional,
              inputRules: fieldInfo.inputRules,
              inputOptions: fieldInfo.inputOptions,
              value: null,
              getOptions: fieldInfo.getOptions,
              handleFileAdded:
                typeof fieldElement === 'string'
                  ? null
                  : fieldElement.handleFileAdded,
              options: [],
              readonly: this.mode === 'view',
              loading: false,
              focused: false,
              cols:
                typeof fieldElement === 'string'
                  ? fieldInfo.inputOptions?.cols
                  : fieldElement.cols,
              generation: 0,
              parentInput: null,
              nestedInputsArray: [],
              inputData: null,
              hideIf:
                typeof fieldElement === 'string'
                  ? undefined
                  : fieldElement.hideIf,
              watch:
                typeof fieldElement === 'string'
                  ? undefined
                  : fieldElement.watch,
            }

            // if copy mode and fieldKey not in original fields, use default
            if (this.mode === 'copy' && !this.rawFields.includes(fieldKey)) {
              inputObject.value = fieldInfo.default
                ? await fieldInfo.default(this)
                : null
            } else {
              inputObject.value = fieldInfo.hidden
                ? null
                : getNestedProperty(data, primaryField)
            }

            // if it is an array, populate the nestedInputsArray
            if (inputObject.inputType === 'value-array') {
              if (Array.isArray(inputObject.value)) {
                inputObject.value.forEach((ele) =>
                  addNestedInputObject(inputObject, ele)
                )
              }
            }

            // populate inputObjects if we need to translate any IDs to objects, and also populate any options
            dropdownPromises.push(
              ...populateInputObject(this, {
                inputObject,
                selectedItem: this.selectedItem,
              })
            )

            return inputObject
          })
        )
        // do post-processing on inputsArray, if function provided
        if (this.mode === 'edit') {
          this.recordInfo.editOptions.afterLoaded &&
            (await this.recordInfo.editOptions.afterLoaded(
              this,
              this.inputsArray
            ))
        } else if (this.mode === 'copy') {
          this.recordInfo.addOptions.afterLoaded &&
            (await this.recordInfo.addOptions.afterLoaded(
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

        if (this.selectedItem && inputObject.fieldKey in this.selectedItem) {
          inputObject.value = this.selectedItem[inputObject.fieldKey]
        } else {
          inputObject.value = inputObject.fieldInfo.default
            ? await inputObject.fieldInfo.default(this)
            : null
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
          throw new Error('Adding of this record is not configured')
        }

        this.inputsArray = await Promise.all(
          this.fields.map(async (fieldElement) => {
            const fieldKey =
              typeof fieldElement === 'string'
                ? fieldElement
                : fieldElement.field

            const fieldInfo = lookupFieldInfo(this.recordInfo, fieldKey)

            const inputObject = {
              fieldKey,
              primaryField: fieldInfo.fields ? fieldInfo.fields[0] : fieldKey,
              fieldInfo,
              recordInfo: this.recordInfo,
              inputType: fieldInfo.inputType,
              label: fieldInfo.text ?? fieldKey,
              hint: fieldInfo.hint,
              clearable: true,
              closeable: false,
              optional: fieldInfo.optional,
              inputRules: fieldInfo.inputRules,
              inputOptions: fieldInfo.inputOptions,
              value: null,
              inputValue: null,
              getOptions: fieldInfo.getOptions,
              handleFileAdded:
                typeof fieldElement === 'string'
                  ? null
                  : fieldElement.handleFileAdded,
              options: [],
              readonly: false,
              hidden: this.hiddenFields.includes(fieldKey),
              loading: false,
              focused: false,
              cols:
                typeof fieldElement === 'string'
                  ? fieldInfo.inputOptions?.cols
                  : fieldElement.cols,
              generation: 0,
              parentInput: null,
              nestedInputsArray: [],
              inputData: null,
              hideIf:
                typeof fieldElement === 'string'
                  ? undefined
                  : fieldElement.hideIf,
              watch:
                typeof fieldElement === 'string'
                  ? undefined
                  : fieldElement.watch,
            }

            // is the field in selectedItem? if so, use that and set field to readonly
            if (
              this.selectedItem &&
              fieldKey in this.selectedItem &&
              this.selectedItem[fieldKey] !== undefined
            ) {
              inputObject.value = this.selectedItem[fieldKey]
              inputObject.readonly = true
              // if hideLockedFields, also set those fields to hidden
              if (this.hideLockedFields) inputObject.hidden = true
            } else {
              inputObject.value = fieldInfo.default
                ? await fieldInfo.default(this)
                : null
            }

            // if it is an array, populate the nestedInputsArray
            if (inputObject.inputType === 'value-array') {
              if (Array.isArray(inputObject.value)) {
                inputObject.value.forEach((ele) =>
                  addNestedInputObject(inputObject, ele)
                )
              }
            }

            // populate inputObjects if we need to translate any IDs to objects, and also populate any options
            await Promise.all(
              populateInputObject(this, {
                inputObject,
                selectedItem: this.selectedItem,
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

      // load dropdowns in this.inputOptions
      this.loadDropdowns()

      // set all loading to false (could have been stuck from previous operations)
      for (const prop in this.loading) {
        this.loading[prop] = false
      }

      // initialize inputs
      if (this.mode === 'add') {
        await this.initializeInputs()
        // do post-processing on inputsArray, if function provided
        this.recordInfo.addOptions.afterLoaded &&
          (await this.recordInfo.addOptions.afterLoaded(this, this.inputsArray))
        this.afterInitializeInputs && this.afterInitializeInputs()
      } else {
        this.loadRecord()
      }
    },
  },
}
