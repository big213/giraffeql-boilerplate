import { executeGiraffeql } from '~/services/giraffeql'
import {
  collapseObject,
  getNestedProperty,
  capitalizeString,
  handleError,
  isObject,
  serializeNestedProperty,
  setInputValue,
  getInputValue,
  getInputObject,
  populateInputObject,
  lookupFieldInfo,
  addNestedInputObject,
} from '~/services/base'
import GenericInput from '~/components/input/genericInput.vue'

export default {
  components: {
    GenericInput,
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
    }
  },

  computed: {
    isLoading() {
      return Object.values(this.loading).some((state) => state)
    },

    fields() {
      return this.customFields ?? this.recordInfo[`${this.mode}Options`].fields
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
      return this.hiddenFields.length
        ? this.inputsArray.filter(
            (inputObject) => !this.hiddenFields.includes(inputObject.fieldKey)
          )
        : this.inputsArray
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
    refreshCb(typename) {
      if (this.recordInfo.typename === typename) {
        this.reset()
      }
    },

    setInputValue(key, value) {
      return setInputValue(this.inputsArray, key, value)
    },

    getInputValue(key) {
      return getInputValue(this.inputsArray, key)
    },

    getInputObject(key) {
      return getInputObject(this.inputsArray, key)
    },

    handleSubmit() {
      // if any comboboxes, wait for 500 ms before doing submit to let the value sync
      let sleep = false
      if (
        this.inputsArray.some((ele) => {
          return (
            ele.fieldInfo.inputType === 'combobox' ||
            ele.fieldInfo.inputType === 'server-combobox'
          )
        })
      ) {
        sleep = true
      }

      // if any inputs are loading, hold
      if (
        this.inputsArray.some((inputObject) => inputObject.loading === true)
      ) {
        this.$notifier.showSnackbar({
          message: 'Some inputs are not finished loading',
          variant: 'error',
        })
        return
      }
      // set editRecord loading to true to prevent clicking multiple times
      this.loading.editRecord = true

      setTimeout(this.submit, sleep ? 500 : 0)
    },

    async processInputObject(inputObject) {
      let value

      // if it is a value array, need to assemble the value as an array
      if (inputObject.inputType === 'value-array') {
        value = []
        for (const nestedInputArray of inputObject.nestedInputsArray) {
          const obj = {}
          for (const nestedInputObject of nestedInputArray) {
            obj[
              nestedInputObject.nestedFieldInfo.key
            ] = await this.processInputObject(nestedInputObject.inputObject)
          }
          value.push(obj)
        }
      } else {
        // if the fieldInfo.inputType === 'combobox' | 'server-combobox', it came from a combo box. need to handle accordingly
        if (
          (inputObject.inputType === 'combobox' ||
            inputObject.inputType === 'server-combobox') &&
          inputObject.inputOptions?.typename
        ) {
          if (typeof inputObject.value === 'string') {
            // expecting either string or obj
            // create the item, get its id.
            const results = await executeGiraffeql(this, {
              ['create' +
              capitalizeString(inputObject.inputOptions.typename)]: {
                id: true,
                name: true,
                __args: {
                  name: inputObject.value,
                },
              },
            })

            // force reload of memoized options, if any
            inputObject.getOptions &&
              inputObject
                .getOptions(this, true)
                .then((res) => (inputObject.options = res))

            value = results.id
          } else if (inputObject.value === null) {
            value = inputObject.value
          } else {
            value = inputObject.value.id
          }
        } else if (
          inputObject.inputType === 'autocomplete' ||
          inputObject.inputType === 'server-autocomplete' ||
          inputObject.inputType === 'select'
        ) {
          // as we are using return-object option, the entire object will be returned for autocompletes/selects, unless it is null or a number
          value = isObject(inputObject.value)
            ? inputObject.value.id
            : Number.isNaN(inputObject.value)
            ? null
            : inputObject.value
        } else {
          value = inputObject.value
        }

        // convert '__null' to null
        if (value === '__null') value = null
      }

      return inputObject.fieldInfo.parseValue
        ? inputObject.fieldInfo.parseValue(value)
        : value
    },

    async submit() {
      this.loading.editRecord = true
      try {
        const inputs = {}

        for (const inputObject of this.inputsArray) {
          inputs[inputObject.primaryField] = await this.processInputObject(
            inputObject
          )
        }

        // add/copy mode
        let query
        if (this.mode === 'add' || this.mode === 'copy') {
          query = {
            [this.recordInfo.addOptions.operationName ??
            'create' + this.capitalizedType]: {
              id: true,
              ...this.returnFields,
              __args: collapseObject(inputs),
            },
          }
        } else {
          query = {
            [this.recordInfo.editOptions.operationName ??
            'update' + this.capitalizedType]: {
              id: true,
              ...this.returnFields,
              __args: {
                item: {
                  id: this.selectedItem.id,
                },
                fields: collapseObject(inputs),
              },
            },
          }
        }
        const data = await executeGiraffeql(this, query)

        this.$notifier.showSnackbar({
          message:
            this.recordInfo.name +
            (this.mode === 'add' || this.mode === 'copy'
              ? ' Added'
              : ' Updated'),
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
      // run any custom onSuccess functions
      if (this.mode === 'add' || this.mode === 'edit') {
        const onSuccess = this.recordInfo[`${this.mode}Options`].onSuccess

        if (onSuccess) {
          onSuccess(this)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit('refresh-interface', this.recordInfo.typename)
        }
      }

      this.$emit('close')
      this.$emit('handle-submit', data)
    },

    async loadRecord() {
      this.loading.loadRecord = true
      try {
        // create a map field -> serializeFn for fast serialization
        const serializeMap = new Map()

        const data = await executeGiraffeql(this, {
          ['get' + this.capitalizedType]: {
            __typename: true,
            ...collapseObject(
              this.fields.reduce(
                (total, fieldKey) => {
                  const fieldInfo = lookupFieldInfo(this.recordInfo, fieldKey)

                  // if field is hidden, exclude
                  if (fieldInfo.hidden) return total

                  const fieldsToAdd = new Set()

                  // add all fields
                  if (fieldInfo.fields) {
                    fieldInfo.fields.forEach((field) => fieldsToAdd.add(field))
                  } else {
                    fieldsToAdd.add(fieldKey)
                  }

                  // process fields
                  fieldsToAdd.forEach((field) => {
                    total[field] = true

                    // add a serializer if there is one for the field
                    const currentFieldInfo = this.recordInfo.fields[field]
                    if (currentFieldInfo) {
                      if (currentFieldInfo.serialize) {
                        serializeMap.set(field, currentFieldInfo.serialize)
                      }

                      // if field has args, process them
                      if (currentFieldInfo.args) {
                        total[
                          currentFieldInfo.args.path + '.__args'
                        ] = currentFieldInfo.args.getArgs(this)
                      }
                    }
                  })

                  return total
                },
                { id: true, __typename: true }
              )
            ),
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
          inputFields.map(async (fieldKey) => {
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
              options: [],
              readonly: this.mode === 'view',
              loading: false,
              focused: false,
              cols: fieldInfo.inputOptions?.cols,
              generation: 0,
              parentInput: null,
              nestedInputsArray: [],
            }

            // if copy mode and fieldKey not in original fields, use default
            if (this.mode === 'copy' && !this.fields.includes(fieldKey)) {
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
            dropdownPromises.push(...populateInputObject(this, inputObject))

            return inputObject
          })
        )

        // wait for all dropdown-related promises to complete
        await Promise.all(dropdownPromises)
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

    resetInputs() {
      this.inputsArray.forEach(async (inputObject) => {
        if (inputObject.fieldKey in this.selectedItem) {
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
      this.inputsArray = await Promise.all(
        this.recordInfo.addOptions.fields.map(async (fieldKey) => {
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
            options: [],
            readonly: false,
            loading: false,
            focused: false,
            cols: fieldInfo.inputOptions?.cols,
            generation: 0,
            parentInput: null,
            nestedInputsArray: [],
          }

          // is the field in selectedItem? if so, use that and set field to readonly
          if (fieldKey in this.selectedItem) {
            inputObject.value = this.selectedItem[fieldKey]
            inputObject.readonly = true
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
          await Promise.all(populateInputObject(this, inputObject))

          return inputObject
        })
      )
      this.loading.initInputs = false
    },

    reset() {
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
        this.initializeInputs()
      } else {
        this.loadRecord()
      }
    },
  },
}
