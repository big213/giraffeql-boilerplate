<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'dialog-max-height': dialogMode }" class="pt-3">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <v-container v-else class="px-0">
        <v-row>
          <v-col
            v-for="(inputObject, i) in visibleInputsArray"
            :key="i"
            :cols="inputObject.cols || 12"
            class="py-0"
          >
            <GenericInput
              :item="inputObject"
              :all-items="inputsArray"
              @handle-submit="handleSubmit()"
            ></GenericInput>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions v-if="!isLoading">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        ref="submit"
        color="primary"
        :loading="loading.executeAction"
        @click="handleSubmit()"
        >Submit</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import CircularLoader from '~/components/common/circularLoader.vue'
import GenericInput from '~/components/input/genericInput.vue'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  collapseObject,
  handleError,
  populateInputObject,
  addNestedInputObject,
  processInputObject,
} from '~/services/base'

export default {
  components: {
    CircularLoader,
    GenericInput,
  },
  props: {
    item: {
      type: Object,
    },

    selectedItem: {
      type: Object,
    },

    actionOptions: {
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
          !inputObject.hideIf || !inputObject.hideIf(this, this.inputsArray)
      )
    },
  },

  created() {
    this.reset()
  },

  methods: {
    handleSubmit() {
      // if any comboboxes, wait for 500 ms before doing submit to let the value sync
      let sleep = false
      if (
        this.inputsArray.some((ele) => {
          return (
            ele.inputType === 'combobox' || ele.inputType === 'server-combobox'
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
      // set executeAction loading to true to prevent clicking multiple times
      this.loading.executeAction = true

      setTimeout(this.submit, sleep ? 500 : 0)
    },

    async submit() {
      this.loading.executeAction = true
      try {
        const args = {}

        for (const inputObject of this.inputsArray) {
          args[inputObject.primaryField] = await processInputObject(
            this,
            inputObject,
            this.inputsArray
          )
        }

        // do additional modification of the inputs object, if required
        if (this.actionOptions.argsModifier) {
          this.actionOptions.argsModifier(this, this.item, args)
        }

        if (this.actionOptions.operationName) {
          const query = {
            [this.actionOptions.operationName]: {
              __args: collapseObject(args),
            },
          }

          const data = await executeGiraffeql(this, query)
          this.handleSubmitSuccess(data)
        } else if (this.actionOptions.onSubmit) {
          // if no operationName, must have onSubmit function
          const data = await this.actionOptions.onSubmit(this, this.item, args)
          this.handleSubmitSuccess(data)
        } else {
          throw new Error('Misconfigured action')
        }

        this.$notifier.showSnackbar({
          message: `Action: ${this.actionOptions.title} completed successfully`,
          variant: 'success',
        })

        // reset inputs
        // this.resetInputs()
      } catch (err) {
        handleError(this, err)
      }
      this.loading.executeAction = false
    },

    handleSubmitSuccess(data) {
      this.$emit('close')
      this.$emit('handle-submit', data)

      // run any custom onSuccess functions
      const onSuccess = this.actionOptions.onSuccess
      if (onSuccess) {
        onSuccess(this, this.item)
      }
    },

    async initializeInputs() {
      // set loading state until all inputs are done loading
      this.loading.initInputs = true
      this.inputsArray = await Promise.all(
        this.actionOptions.inputs.map(async (inputDef) => {
          const inputObject = {
            fieldKey: inputDef.field,
            primaryField: inputDef.field,
            fieldInfo: inputDef.definition,
            recordInfo: null,
            inputType: inputDef.definition.inputType,
            label: inputDef.definition.text ?? inputDef.field,
            hint: inputDef.definition.hint,
            clearable: true,
            closeable: false,
            optional: inputDef.definition.optional,
            inputRules: inputDef.definition.inputRules,
            inputOptions: inputDef.definition.inputOptions,
            value: null,
            inputValue: null,
            getOptions: inputDef.definition.getOptions,
            options: [],
            readonly: false,
            hidden: false,
            loading: false,
            focused: false,
            cols: inputDef.definition.inputOptions?.cols,
            generation: 0,
            parentInput: null,
            nestedInputsArray: [],
            hideIf: inputDef.hideIf,
          }

          // is the field in selectedItem? if so, use that and set field to readonly
          if (
            this.selectedItem &&
            inputDef.field in this.selectedItem &&
            this.selectedItem[inputDef.field] !== undefined
          ) {
            inputObject.value = this.selectedItem[inputDef.field]
            inputObject.readonly = true
          } else {
            inputObject.value = inputDef.definition.default
              ? await inputDef.definition.default(this)
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
      this.initializeInputs()
    },
  },
}
</script>
