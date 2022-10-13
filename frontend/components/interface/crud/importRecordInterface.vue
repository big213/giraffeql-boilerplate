<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'dialog-max-height': dialogMode }" class="py-0 mt-3">
      <v-alert type="info">
        CSV must have the following columns:
        <br />
        <span>{{ acceptedFieldsString }}</span>
      </v-alert>
      <v-container>
        <v-row>
          <v-col xs="12" class="py-0">
            <div v-cloak @drop.prevent="handleDropEvent" @dragover.prevent>
              <v-file-input
                v-model="miscInputs.file"
                accept="text/csv"
                label="File input (CSV only) (Drag and Drop)"
                ref="csvFile"
                @change="handleFileUpload"
                @click:clear="reset()"
              ></v-file-input>
            </div>
            <div>
              {{ recordsDone }} / {{ validRecords }} Records Added ({{
                recordsSkipped
              }}
              Skipped)
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        ref="submit"
        color="primary"
        :loading="loading.importing"
        @click="handleSubmit()"
        >Submit</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { executeGiraffeql } from '~/services/giraffeql'
import {
  handleError,
  convertCSVToJSON,
  capitalizeString,
  collapseObject,
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

    // in dialog mode, some changes are made in the component, like max-height
    dialogMode: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      miscInputs: null,
      originalMiscInputs: {
        records: [],
        file: null,
      },

      loading: {
        importing: false,
      },
    }
  },

  computed: {
    recordsDone() {
      return this.miscInputs.records.filter((ele) => ele.isFinished).length
    },

    validRecords() {
      return this.miscInputs.records.filter((ele) => !ele.isSkipped).length
    },

    recordsSkipped() {
      return this.miscInputs.records.filter((ele) => ele.isSkipped).length
    },

    acceptedFieldObjects() {
      // need to exclude any fields in selectedItem that are not undefined
      const excludeFields = Object.entries(this.selectedItem).reduce(
        (total, [key, val]) => {
          if (val !== undefined) total.push(key)
          return total
        },
        []
      )

      return this.recordInfo.importOptions.fields.filter(
        (importFieldObject) => {
          if (!importFieldObject.field) return true

          return !excludeFields.includes(importFieldObject.field)
        }
      )
    },

    acceptedFieldsString() {
      return this.acceptedFieldObjects
        .map((ele) => ele.path ?? ele.field)
        .join(', ')
    },
  },

  created() {
    this.reset()
  },

  methods: {
    handleDropEvent(e) {
      try {
        const files = Array.from(e.dataTransfer.files)

        // only 1 file allowed
        if (files.length !== 1) {
          throw new Error('Only 1 filed allowed to be dropped')
        }

        this.handleFileUpload(files[0])
      } catch (err) {
        handleError(this, err)
      }
    },

    handleFileUpload(file) {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = convertCSVToJSON(event.target.result)

          // if no rows, throw err
          if (!data.length) {
            throw new Error(`No rows in CSV`)
          }

          const acceptedCsvFields = this.acceptedFieldObjects.map(
            (fieldObject) => fieldObject.path ?? fieldObject.field
          )

          // check if only valid fields present (only need to do for first one)
          const firstEntry = data[0]
          for (const key in firstEntry) {
            if (!acceptedCsvFields.includes(key)) {
              throw new Error(`Unrecognized field in CSV: ${key}`)
            }
          }

          const lockedFieldsMap = new Map()
          for (const field in this.selectedItem) {
            const fieldObject = this.recordInfo.importOptions.fields.find(
              (innerFieldObject) => innerFieldObject.field === field
            )
            if (fieldObject) {
              lockedFieldsMap.set(
                fieldObject.path ?? fieldObject.field,
                this.selectedItem[fieldObject.field]
              )
            }
          }

          this.miscInputs.records = data.map((ele) => {
            // inject any locked fields (via selectedItem) into data
            lockedFieldsMap.forEach((val, key) => {
              ele[key] = val
            })

            return {
              data: ele,
              isFinished: false,
              isSkipped: false,
              record: null,
            }
          })

          // build the path -> parseValue map
          const parseValueMap = new Map()
          this.acceptedFieldObjects.forEach((importFieldObject) => {
            if (importFieldObject.parseValue) {
              parseValueMap.set(
                importFieldObject.path,
                importFieldObject.parseValue
              )
            }
          })

          // parse the data if there is a parse function for the field
          this.miscInputs.records.forEach((recordData) => {
            for (const field in recordData.data) {
              // is there a parseValue for this field?
              const parseFn = parseValueMap.get(field)
              if (parseFn) {
                recordData.data[field] = parseFn(recordData.data[field])
              }

              // if the value is an empty string, parse this to null by default
              if (recordData.data[field] === '') recordData.data[field] = null
            }

            // run the inputsModifier, if any
            if (this.recordInfo.importOptions.inputsModifier) {
              this.recordInfo.importOptions.inputsModifier(
                this,
                recordData.data
              )
            }

            // if there is a skipIf function, check it to see if this entry should be skippeed
            if (
              this.recordInfo.importOptions.skipIf &&
              this.recordInfo.importOptions.skipIf(this, recordData.data)
            ) {
              recordData.isSkipped = true
            }
          })

          this.$notifier.showSnackbar({
            message: 'File uploaded',
            variant: 'success',
          })
        } catch (err) {
          // reset records if any error with parsing
          this.reset()
          handleError(this, err)
        }
      }
      reader.readAsText(file)
    },

    async handleSubmit() {
      this.loading.importing = true
      try {
        // must have some records
        if (this.miscInputs.records.length < 1)
          throw new Error('No records to import')

        for (const recordData of this.miscInputs.records) {
          // skip if already finished
          if (recordData.isFinished) continue

          // skip if skipped
          if (recordData.isSkipped) continue

          recordData.record = await executeGiraffeql(this, {
            [this.recordInfo.addOptions.operationName ??
            'create' + capitalizeString(this.recordInfo.typename)]: {
              id: true,
              __args: collapseObject(recordData.data),
            },
          })

          recordData.isFinished = true
        }

        this.$notifier.showSnackbar({
          message: `${this.recordsDone}/${this.miscInputs.records.length} Records Imported`,
          variant: 'success',
        })

        this.$emit('close')
      } catch (err) {
        handleError(this, err)
      } finally {
        // also reload any interfaces containing this type if at least 1 record was added
        if (this.recordsDone > 0) {
          this.handleSuccess()
        }
      }
      this.loading.importing = false
    },

    handleSuccess() {
      // run any custom onSuccess functions
      const onSuccess = this.recordInfo.importOptions.onSuccess

      if (onSuccess) {
        onSuccess(this)
      } else {
        // else emit the generic refresh-interface event
        this.$root.$emit('refresh-interface', this.recordInfo.typename)
      }
    },

    reset() {
      // duplicate misc inputs, if any
      this.miscInputs = JSON.parse(JSON.stringify(this.originalMiscInputs))
    },
  },
}
</script>
