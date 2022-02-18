<template>
  <div>
    <div v-if="item.inputType === 'html'" class="mb-4">
      <wysiwyg v-model="item.value" />
    </div>
    <div
      v-else-if="item.inputType === 'multiple-file'"
      class="mb-4 text-left highlighted-bg"
    >
      <v-container v-if="filesData.length" fluid grid-list-xs class="px-0">
        <Draggable
          v-model="filesData"
          :disabled="item.readonly"
          @change="handleFilesDataUpdate()"
        >
          <FileChip
            v-for="(file, index) in filesData"
            :key="index"
            :file="file"
            downloadable
            small
            label
            :close="!item.readonly"
            close-icon="mdi-close-outline"
            class="mr-2"
            @handleCloseClick="removeFileByIndex(index)"
          ></FileChip>
        </Draggable>
      </v-container>
      <div v-cloak @drop.prevent="handleMultipleDropFile" @dragover.prevent>
        <v-file-input
          v-model="item.inputValue"
          :label="
            item.label +
            ' (Drag and Drop)' +
            (item.optional ? ' (optional)' : '')
          "
          multiple
          :hint="item.hint"
          :loading="item.loading"
          persistent-hint
          :clearable="false"
          @change="handleMultipleFileInputChange(item)"
        >
          <template v-slot:selection="{ file, text }">
            <v-chip
              small
              label
              color="primary"
              close
              close-icon="mdi-close-outline"
              @click:close="handleMultipleFileInputClear(item, file)"
            >
              {{ text }} -
              {{
                file.fileUploadObject
                  ? file.fileUploadObject.progress.toFixed(1)
                  : ''
              }}%
            </v-chip>
          </template>
        </v-file-input>
      </div>
    </div>
    <div
      v-else-if="item.inputType === 'multiple-media'"
      class="mb-4 text-left highlighted-bg"
    >
      <v-container v-if="filesData.length" fluid grid-list-xs class="px-0">
        <Draggable
          v-model="filesData"
          class="layout row wrap"
          :disabled="item.readonly"
          @change="handleFilesDataUpdate()"
        >
          <MediaChip
            v-for="(file, index) in filesData"
            :key="index"
            :file="file"
            downloadable
            draggable
            close
            :readonly="item.readonly"
            class="xs3"
            @handleCloseClick="removeFileByIndex(index)"
          ></MediaChip>
        </Draggable>
      </v-container>
      <div v-cloak @drop.prevent="handleMultipleDropFile" @dragover.prevent>
        <v-file-input
          v-model="item.inputValue"
          :label="
            item.label +
            ' (Drag and Drop)' +
            (item.optional ? ' (optional)' : '')
          "
          multiple
          accept="image/*"
          :hint="item.hint"
          :loading="item.loading"
          persistent-hint
          :clearable="false"
          @change="handleMultipleFileInputChange(item)"
        >
          <template v-slot:selection="{ file, text }">
            <v-chip
              small
              label
              color="primary"
              close
              close-icon="mdi-close-outline"
              @click:close="handleMultipleFileInputClear(item, file)"
            >
              {{ text }} -
              {{
                file.fileUploadObject
                  ? file.fileUploadObject.progress.toFixed(1)
                  : ''
              }}%
            </v-chip>
          </template>
        </v-file-input>
      </div>
    </div>
    <div
      v-else-if="item.inputType === 'multiple-image'"
      class="mb-4 text-center"
    >
      <v-container fluid grid-list-xs class="px-0">
        <Draggable
          v-model="item.value"
          class="layout row wrap"
          :disabled="item.readonly"
        >
          <v-flex
            v-for="(imageUrl, imageIndex) in item.value"
            :key="imageIndex"
            :class="'xs3'"
          >
            <v-card flat>
              <v-system-bar v-if="!item.readonly" lights-out>
                <v-icon @click="void 0">mdi-arrow-all</v-icon>
                <v-spacer></v-spacer>
                <v-btn icon @click.native="removeFileByIndex(imageIndex)">
                  <v-icon color="error">mdi-close</v-icon>
                </v-btn>
              </v-system-bar>
              <v-img :src="imageUrl" aspect-ratio="1" contain></v-img>
            </v-card>
          </v-flex>
        </Draggable>
      </v-container>
      <div v-cloak @drop.prevent="handleMultipleDropFile" @dragover.prevent>
        <v-file-input
          v-model="item.inputValue"
          :label="
            item.label +
            ' (Drag and Drop)' +
            (item.optional ? ' (optional)' : '')
          "
          multiple
          :hint="item.hint"
          :loading="item.loading"
          persistent-hint
          :clearable="false"
          @change="handleMultipleFileInputChange(item)"
        >
          <template v-slot:selection="{ file, text }">
            <v-chip
              small
              label
              color="primary"
              close
              close-icon="mdi-close-outline"
              @click:close="handleMultipleFileInputClear(item, file)"
            >
              {{ text }} -
              {{
                file.fileUploadObject
                  ? file.fileUploadObject.progress.toFixed(1)
                  : ''
              }}%
            </v-chip>
          </template>
        </v-file-input>
      </div>
    </div>

    <div v-else-if="item.inputType === 'single-image'" class="mb-4 text-center">
      <v-img
        v-if="item.value"
        :src="item.value"
        contain
        max-height="200"
      ></v-img>
      <v-icon v-else>mdi-file-image</v-icon>
      <div v-cloak @drop.prevent="handleSingleDropFile" @dragover.prevent>
        <v-file-input
          v-if="!item.readonly"
          v-model="item.inputValue"
          :append-icon="item.value ? 'mdi-close' : null"
          :append-outer-icon="item.closeable ? 'mdi-close' : null"
          :clearable="false"
          accept="image/*"
          :label="item.label + (item.optional ? ' (optional)' : '')"
          :hint="item.hint"
          :loading="item.loading"
          persistent-hint
          @click:append="handleSingleFileInputClear(item)"
          @change="handleSingleFileInputChange(item)"
          @click:append-outer="handleClose()"
        >
          <template v-slot:selection="{ file, text }">
            <v-chip
              small
              label
              color="primary"
              close
              close-icon="mdi-close-outline"
              @click:close="handleSingleFileInputClear(item)"
            >
              {{ text }} -
              {{
                file.fileUploadObject
                  ? file.fileUploadObject.progress.toFixed(1)
                  : ''
              }}%
            </v-chip>
          </template>
        </v-file-input>
      </div>
    </div>
    <div
      v-else-if="item.inputType === 'avatar'"
      class="mb-4"
      :class="isReadonly ? 'text-center' : 'd-flex text-left'"
    >
      <v-avatar size="64">
        <v-img v-if="item.value" :src="item.value"></v-img>
        <v-icon v-else>{{ recordIcon }}</v-icon>
      </v-avatar>
      <v-file-input
        v-if="!item.readonly"
        v-model="item.inputValue"
        :append-icon="item.value ? 'mdi-close' : null"
        :append-outer-icon="item.closeable ? 'mdi-close' : null"
        :clearable="false"
        class="pl-2"
        accept="image/*"
        :label="item.label + (item.optional ? ' (optional)' : '')"
        :hint="item.hint"
        :loading="item.loading"
        persistent-hint
        @click:append="handleSingleFileInputClear(item)"
        @change="handleSingleFileInputChange(item)"
        @click:append-outer="handleClose()"
      >
        <template v-slot:selection="{ file, text }">
          <v-chip
            small
            label
            color="primary"
            close
            close-icon="mdi-close-outline"
            @click:close="handleSingleFileInputClear(item)"
          >
            {{ text }} -
            {{
              file.fileUploadObject
                ? file.fileUploadObject.progress.toFixed(1)
                : ''
            }}%
          </v-chip>
        </template>
      </v-file-input>
    </div>
    <v-textarea
      v-else-if="item.inputType === 'textarea'"
      v-model="item.value"
      filled
      auto-grow
      rows="1"
      dense
      class="py-0"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    ></v-textarea>
    <v-switch
      v-else-if="item.inputType === 'switch'"
      v-model="item.value"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    ></v-switch>
    <v-menu
      v-else-if="item.inputType === 'datepicker'"
      v-model="item.focused"
      :close-on-content-click="false"
      :nudge-right="40"
      transition="scale-transition"
      offset-y
      min-width="290px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          v-model="item.value"
          :label="item.label + (item.optional ? ' (optional)' : '')"
          :readonly="isReadonly"
          :append-icon="appendIcon"
          :append-outer-icon="item.closeable ? 'mdi-close' : null"
          :hint="item.hint"
          :loading="item.loading"
          persistent-hint
          filled
          autocomplete="off"
          v-bind="attrs"
          v-on="on"
          @input="syncDatePickerInput"
          @click:append="handleClear()"
          @click:append-outer="handleClose()"
        ></v-text-field>
      </template>
      <v-date-picker
        v-model="tempInput"
        color="primary"
        no-title
        :readonly="isReadonly"
        @input="item.focused = false"
        @change="applyDatePickerInput"
      ></v-date-picker>
    </v-menu>
    <v-combobox
      v-else-if="item.inputType === 'combobox'"
      ref="combobox"
      v-model="item.value"
      :items="item.options"
      item-text="name"
      item-value="id"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      filled
      class="py-0"
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    ></v-combobox>
    <v-combobox
      v-else-if="item.inputType === 'server-combobox'"
      ref="combobox"
      v-model="item.value"
      :search-input.sync="item.inputValue"
      :items="item.options"
      item-text="name"
      item-value="id"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      filled
      hide-no-data
      class="py-0"
      v-on="$listeners"
      :chips="item.inputOptions && item.inputOptions.hasAvatar"
      @update:search-input="handleSearchUpdate(item)"
      @blur="item.focused = false"
      @focus="item.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:item="data"
      >
        <v-chip pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }} </v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:selection="data"
      >
        <v-chip v-bind="data.attrs" pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }}</v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
    </v-combobox>
    <v-autocomplete
      v-else-if="item.inputType === 'autocomplete'"
      v-model="item.value"
      :items="item.options"
      item-text="name"
      item-value="id"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      filled
      return-object
      class="py-0"
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:item="data"
      >
        <v-chip pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }} </v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:selection="data"
      >
        <v-chip v-bind="data.attrs" pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }}</v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
    </v-autocomplete>
    <v-autocomplete
      v-else-if="item.inputType === 'server-autocomplete'"
      v-model="item.value"
      :search-input.sync="item.inputValue"
      :items="item.options"
      item-text="name"
      item-value="id"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      filled
      hide-no-data
      return-object
      class="py-0"
      :chips="item.inputOptions && item.inputOptions.hasAvatar"
      v-on="$listeners"
      @update:search-input="handleSearchUpdate(item)"
      @blur="item.focused = false"
      @focus="item.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:item="data"
      >
        <v-chip pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }} </v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:selection="data"
      >
        <v-chip v-bind="data.attrs" pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }}</v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
    </v-autocomplete>
    <v-select
      v-else-if="
        item.inputType === 'select' || item.inputType === 'multiple-select'
      "
      v-model="item.value"
      :items="item.options"
      :multiple="item.inputType === 'multiple-select'"
      filled
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      :hint="item.hint"
      :loading="item.loading"
      persistent-hint
      return-object
      item-text="name"
      item-value="id"
      class="py-0"
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:item="data"
      >
        <v-chip pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }} </v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
      <template
        v-if="item.inputOptions && item.inputOptions.hasAvatar"
        v-slot:selection="data"
      >
        <v-chip v-bind="data.attrs" pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }}</v-icon>
          </v-avatar>
          {{ data.item.name }}
        </v-chip>
      </template>
    </v-select>
    <div
      v-else-if="item.inputType === 'value-array'"
      class="accent rounded-sm mb-4"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <div class="subtitle-1">
              {{ item.label + (item.optional ? ' (optional)' : '') }}
            </div>
            <div v-if="item.hint">{{ item.hint }}</div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <div v-if="item.nestedInputsArray.length > 0">
              <Draggable
                v-model="item.nestedInputsArray"
                :disabled="item.readonly"
              >
                <v-row
                  v-for="(nestedInputArray, i) in item.nestedInputsArray"
                  :key="i"
                  class="highlighted-bg"
                >
                  <v-col cols="12" class="pa-0 pb-1" key="-1">
                    <v-system-bar lights-out>
                      <v-icon @click="void 0">mdi-arrow-all</v-icon>
                      Entry #{{ i + 1 }}
                      <v-spacer></v-spacer>
                      <v-icon @click="removeRow(i)" color="error"
                        >mdi-close</v-icon
                      >
                    </v-system-bar>
                  </v-col>
                  <v-col
                    v-for="(nestedInputObject, j) in nestedInputArray"
                    cols="12"
                    :sm="nestedInputObject.inputObject.cols || 12"
                    class="py-0"
                    :key="j"
                  >
                    <GenericInput
                      :item="nestedInputObject.inputObject"
                    ></GenericInput>
                  </v-col>
                </v-row>
              </Draggable>
            </div>
            <div v-else class="pb-3">No entries</div>
          </v-col>
        </v-row>
        <v-row v-if="!isReadonly" @click="addRow()">
          <v-col cols="12" class="pa-0">
            <v-btn small block>
              <v-icon left>mdi-plus</v-icon>
              Add Entry
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <v-text-field
      v-else
      v-model="item.value"
      :label="item.label + (item.optional ? ' (optional)' : '')"
      :readonly="isReadonly"
      :rules="item.inputRules"
      :hint="item.hint"
      :loading="item.loading"
      :append-icon="appendIcon"
      :append-outer-icon="item.closeable ? 'mdi-close' : null"
      persistent-hint
      filled
      dense
      class="py-0"
      v-on="$listeners"
      @click:append="handleClear()"
      @keyup.enter="triggerSubmit()"
      @click:append-outer="handleClose()"
      @input="triggerInput()"
    ></v-text-field>
  </div>
</template>

<script>
import Draggable from 'vuedraggable'
import { uploadFile, generateFileServingUrl } from '~/services/file'
import {
  capitalizeString,
  isObject,
  handleError,
  getIcon,
  collectPaginatorData,
  addNestedInputObject,
  generateDateLocaleString,
} from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import FileChip from '~/components/chip/fileChip.vue'
import MediaChip from '~/components/chip/mediaChip.vue'

export default {
  name: 'GenericInput',
  components: {
    Draggable,
    FileChip,
    MediaChip,
  },
  props: {
    // type: CrudInputObject
    item: {
      type: Object,
      required: true,
    },
    allItems: {
      type: Array,
      required: false,
      default: () => [],
    },
    parentItem: {
      type: Object,
    },
  },

  data() {
    return {
      tempInput: null,
      filesData: [],
      filesProcessingQueue: null,
    }
  },

  computed: {
    isReadonly() {
      return this.item.readonly
    },
    icon() {
      return getIcon(this.item.inputOptions?.typename)
    },

    recordIcon() {
      return this.item.recordInfo?.icon
    },

    appendIcon() {
      return this.item.value === null
        ? 'mdi-null'
        : this.isReadonly
        ? null
        : this.item.clearable
        ? 'mdi-close'
        : null
    },
  },

  watch: {
    'item.generation'() {
      this.reset()
    },
  },

  mounted() {
    this.reset()
  },

  methods: {
    generateFileServingUrl,
    handleClear() {
      this.item.value = null
      this.$emit('change', this.item.value)
    },
    handleClose() {
      this.$emit('handle-close')
    },

    triggerInput() {
      this.$emit('handle-input')
    },

    triggerSubmit() {
      this.$emit('handle-submit')
    },

    applyDatePickerInput(val) {
      this.item.value = val + ' 12:00:00 AM'
    },

    syncDatePickerInput(val) {
      // if the dateTextInput is like YYYY-MM-DD, parse that
      if (val && val.match(/^\d{4}-\d{2}-\d{2}\s/)) {
        this.tempInput = val.split(' ')[0]
      } else {
        this.tempInput = null
      }
    },

    addRow() {
      addNestedInputObject(this.item)
    },

    removeRow(index) {
      this.item.nestedInputsArray.splice(index, 1)
    },

    handleSearchUpdate(inputObject) {
      // if empty input, don't do the update
      if (!inputObject.inputValue) return

      // if inputObject is object and search === value.name, skip
      if (
        isObject(inputObject.value) &&
        inputObject.inputValue === inputObject.value.name
      ) {
        return
      }

      // cancel pending call, if any
      clearTimeout(this._timerId)

      // delay new call 500ms
      this._timerId = setTimeout(() => {
        this.loadSearchResults(inputObject)
      }, 500)
    },

    removeFileByIndex(index) {
      this.filesData.splice(index, 1)

      this.handleFilesDataUpdate()
    },

    handleFilesDataUpdate() {
      this.item.value = this.filesData.map((ele) => ele.id)
    },

    handleFileRemove(inputObject, file) {
      // cancel the uploadTask, if there is one
      file.fileUploadObject?.uploadTask.cancel()

      // remove the file from the inputObject files queue
      const index = inputObject.files.indexOf(file)
      if (index !== -1) inputObject.files.splice(index, 1)

      // if no files left, set loading to false
      if (inputObject.files.length < 1) inputObject.loading = false
    },

    handleMultipleFileInputClear(inputObject, file) {
      const index = inputObject.inputValue.indexOf(file)

      if (index !== -1) {
        inputObject.inputValue[index].fileUploadObject?.uploadTask.cancel()
        inputObject.inputValue.splice(index, 1)
      }

      // if no files left, set loading to false
      if (inputObject.inputValue.length < 1) {
        inputObject.loading = false
      }
    },

    handleMultipleDropFile(e) {
      if (!this.item.inputValue) this.item.inputValue = []
      this.item.inputValue.push(...Array.from(e.dataTransfer.files))

      this.handleMultipleFileInputChange(this.item)
    },

    handleSingleDropFile(e) {
      if (!this.item.inputValue) this.item.inputValue = []
      const filesArray = Array.from(e.dataTransfer.files)
      this.item.inputValue = filesArray[filesArray.length - 1]

      this.handleSingleFileInputChange(this.item)
    },

    handleMultipleFileInputChange(inputObject, removeFromInput = true) {
      this.$set(inputObject, 'loading', true)

      // inputObject.inputValue expected to be array
      inputObject.inputValue.forEach((currentFile) => {
        // add each file to the processing queue if the file is not already in there
        if (!this.filesProcessingQueue.has(currentFile)) {
          this.filesProcessingQueue.set(currentFile, false)
        }
      })

      // process each file in the processing queue if not already processing
      this.filesProcessingQueue.forEach((processed, currentFile) => {
        if (processed) return

        this.filesProcessingQueue.set(currentFile, true)

        uploadFile(this, currentFile, (file, fileRecord) => {
          // add finished fileRecord to filesData
          this.filesData.push(file.fileUploadObject.fileRecord)

          // remove file from input
          if (removeFromInput) {
            const index = inputObject.inputValue.indexOf(file)
            if (index !== -1) inputObject.inputValue.splice(index, 1)
          }

          // remove file from the queue by the key (filename)
          this.filesProcessingQueue.delete(currentFile)

          // emit the file to parent (in case it is needed)
          this.$emit('file-added', inputObject, fileRecord)

          // if no files left, finish up
          if (inputObject.inputValue.length < 1) {
            inputObject.loading = false
            this.handleFilesDataUpdate()
            this.$notifier.showSnackbar({
              message: 'File Uploaded',
              variant: 'success',
            })
          }
        })
      })
    },

    handleSingleFileInputClear(inputObject) {
      inputObject.value = null
      if (inputObject.filesQueue) {
        inputObject.filesQueue.forEach((file) => {
          file.fileUploadObject?.uploadTask.cancel()
        })
      }
      inputObject.filesQueue = []
      inputObject.inputValue = null
      inputObject.loading = false
    },

    handleSingleFileInputChange(inputObject) {
      if (!inputObject.inputValue) {
        this.handleSingleFileInputClear(inputObject)
        return
      }
      this.$set(inputObject, 'loading', true)

      if (inputObject.filesQueue) {
        // cancel any existing file uploads, clear out file queue
        inputObject.filesQueue.forEach((file) => {
          file.fileUploadObject?.uploadTask.cancel()
        })
      }

      // reset the filesQueue
      inputObject.filesQueue = [inputObject.inputValue]

      // upload the file(s) to CDN, then load them into value on finish
      uploadFile(this, inputObject.inputValue, (file) => {
        inputObject.value = file.fileUploadObject.servingUrl
        inputObject.loading = false

        // remove from filesQueue
        const index = inputObject.filesQueue.indexOf(file)
        if (index !== -1) inputObject.filesQueue.splice(index, 1)

        this.$notifier.showSnackbar({
          message: 'File Uploaded',
          variant: 'success',
        })
      })
    },

    async loadSearchResults(inputObject) {
      inputObject.loading = true
      try {
        const results = await executeGiraffeql(this, {
          [`get${capitalizeString(
            inputObject.inputOptions.typename
          )}Paginator`]: {
            edges: {
              node: {
                id: true,
                name: true,
                ...(inputObject.inputOptions?.hasAvatar && {
                  avatar: true,
                }),
              },
            },
            __args: {
              first: 20,
              search: inputObject.inputValue,
              filterBy: inputObject.fieldInfo.lookupFilters
                ? inputObject.fieldInfo.lookupFilters(this, this.allItems)
                : [],
            },
          },
        })

        inputObject.options = results.edges.map((edge) => edge.node)
      } catch (err) {
        handleError(this, err)
      }
      inputObject.loading = false
    },

    async loadFiles(inputObject) {
      inputObject.loading = true
      try {
        if (Array.isArray(inputObject.value) && inputObject.value.length > 0) {
          // fetch data
          const fileData = await collectPaginatorData(
            this,
            'getFilePaginator',
            {
              id: true,
              name: true,
              size: true,
              contentType: true,
            },
            {
              filterBy: [
                {
                  parentKey: {
                    eq: `${this.parentItem.__typename}_${this.parentItem.id}`,
                  },
                  id: {
                    in: inputObject.value,
                  },
                },
              ],
            }
          )

          this.filesData = inputObject.value
            .map((fileId) => fileData.find((val) => val.id === fileId))
            .filter((val) => val)
        }
      } catch (err) {
        handleError(this, err)
      }
      inputObject.loading = false
    },

    reset() {
      switch (this.item.inputType) {
        case 'multiple-file':
        case 'multiple-media':
          this.filesData = []
          this.filesProcessingQueue = new Map()
          if (this.parentItem) {
            this.loadFiles(this.item)
          }
          break
        case 'datepicker':
          // if the value is a number, transform it into string
          if (!isNaN(Number(this.item.value))) {
            this.item.value = generateDateLocaleString(this.item.value)
          }
          this.syncDatePickerInput(this.item.inputValue)
          break
      }
    },
  },
}
</script>

<style scoped>
.highlighted-bg {
  border: 1px solid rgb(122, 122, 122);
}
</style>
