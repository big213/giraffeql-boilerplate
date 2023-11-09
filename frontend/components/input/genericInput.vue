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
          class="layout row wrap"
          :disabled="item.readonly"
          @change="handleFilesDataUpdate()"
        >
          <MediaChip
            v-if="item.inputOptions && item.inputOptions.mediaMode"
            v-for="(file, index) in filesData"
            :key="index"
            :file="file"
            draggable
            close
            openable
            :readonly="item.readonly"
            class="xs3"
            @handleCloseClick="removeFileByIndex(index)"
          ></MediaChip>
          <FileChip
            v-else
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
          v-model="tempInput"
          :label="
            item.label +
            ' (Drag and Drop)' +
            (item.optional ? ' (optional)' : '') +
            (limit ? ` (Limit ${limit})` : '')
          "
          multiple
          :accept="acceptedFiles"
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
              {{ text }} - {{ renderFileUploadProgress(file) }}%
            </v-chip>
          </template>
        </v-file-input>
      </div>
    </div>
    <!--
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
    -->
    <div
      v-else-if="item.inputType === 'single-file-url'"
      class="mb-4 highlighted-bg"
      :class="isReadonly ? 'text-center' : 'd-flex text-left'"
      v-cloak
      @drop.prevent="handleDropEvent"
      @dragover.prevent
    >
      <label
        v-if="!item.loading"
        :for="`file-upload-${$vnode.key}`"
        class="custom-file-upload pt-5 text-center"
        style="width: 100px"
      >
        <v-icon>mdi-upload</v-icon>
        Upload
      </label>
      <label
        v-else
        class="custom-file-upload pt-3 text-center"
        style="width: 100px"
      >
        <v-progress-circular :value="item.inputValue.progress" size="48"
          >{{ item.inputValue.progress.toFixed(0) }}%</v-progress-circular
        >
      </label>
      <input
        :id="`file-upload-${$vnode.key}`"
        type="file"
        style="display: none"
        :accept="acceptedFiles"
        @change="handleSingleFileInputChange"
      />
      <v-text-field
        v-model="item.value"
        :label="item.label + (item.optional ? ' (optional)' : '')"
        :readonly="isReadonly"
        :rules="item.inputRules"
        :hint="item.hint"
        :disabled="item.loading"
        :loading="item.loading"
        :append-icon="appendIcon"
        :append-outer-icon="item.closeable ? 'mdi-close' : null"
        persistent-hint
        filled
        dense
        class="pl-2 py-0"
        v-on="$listeners"
        @click:append="handleClear()"
        @click:append-outer="handleClose()"
        @input="triggerInput()"
      ></v-text-field>
    </div>
    <div
      v-else-if="item.inputType === 'single-image-url'"
      class="mb-4 highlighted-bg text-center"
      v-cloak
      @drop.prevent="handleDropEvent"
      @dragover.prevent
    >
      <div
        v-if="
          !item.inputOptions || (!item.inputOptions.avatarOptions && item.value)
        "
        class="pt-2"
      >
        <v-img :src="item.value" contain max-height="200"></v-img>
      </div>
      <div class="d-flex text-left pt-2">
        <v-avatar
          v-if="item.inputOptions && item.inputOptions.avatarOptions"
          size="64"
        >
          <v-img v-if="item.value" :src="item.value"></v-img>
          <v-icon v-else>{{ fallbackIcon }}</v-icon>
        </v-avatar>
        <label
          :for="`file-upload-${$vnode.key}`"
          class="custom-file-upload pt-5 text-center"
        >
          <v-icon>mdi-upload</v-icon>
          Upload
        </label>
        <input
          :id="`file-upload-${$vnode.key}`"
          type="file"
          style="display: none"
          accept="image/*"
          @change="handleSingleFileInputChange"
        />
        <v-text-field
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
          class="pl-2 py-0"
          v-on="$listeners"
          @click:append="handleClear()"
          @click:append-outer="handleClose()"
          @input="triggerInput()"
        ></v-text-field>
      </div>
    </div>
    <v-textarea
      v-else-if="item.inputType === 'textarea'"
      v-model="item.value"
      filled
      rows="3"
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
    <v-text-field
      v-else-if="item.inputType === 'datetimepicker'"
      v-model="tempInput"
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
      type="datetime-local"
      class="py-0"
      v-on="$listeners"
      @click:append="handleClear()"
      @keyup.enter="triggerSubmit()"
      @click:append-outer="handleClose()"
      @input="handleDateTimeInputChange($event) || triggerInput()"
    ></v-text-field>
    <v-combobox
      v-else-if="item.inputType === 'combobox'"
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
      class="py-0"
      v-on="$listeners"
      @blur="item.focused = false"
      @focus="item.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:item="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else pill>
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:selection="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else v-bind="data.attrs" pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }}</v-icon>
          </v-avatar>
          {{ standardizeComboboxName(data.item) }}
        </v-chip>
      </template>
    </v-combobox>
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
      no-filter
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:item="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else pill>
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:selection="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else v-bind="data.attrs" pill>
          <v-avatar left>
            <v-img
              v-if="data.item.avatar"
              :src="data.item.avatar"
              contain
            ></v-img
            ><v-icon v-else>{{ icon }}</v-icon>
          </v-avatar>
          {{ standardizeComboboxName(data.item) }}
        </v-chip>
      </template>
    </v-combobox>
    <v-autocomplete
      v-else-if="
        item.inputType === 'autocomplete' ||
        item.inputType === 'autocomplete-multiple'
      "
      v-model="item.value"
      :items="item.options"
      :multiple="item.inputType === 'autocomplete-multiple'"
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
      :chips="item.inputOptions && item.inputOptions.hasAvatar"
      v-on="$listeners"
      @blur="item.focused = false"
      @focus="item.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:item="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else pill>
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:selection="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else v-bind="data.attrs" pill>
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
      no-filter
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:item="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else pill>
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:selection="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else v-bind="data.attrs" pill>
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
      :chips="item.inputOptions && item.inputOptions.hasAvatar"
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:item="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else pill>
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
        v-if="
          item.inputOptions &&
          (item.inputOptions.hasAvatar || item.inputOptions.selectionComponent)
        "
        v-slot:selection="data"
      >
        <component
          v-if="item.inputOptions.selectionComponent"
          :is="item.inputOptions.selectionComponent"
          :value="data.item"
        >
        </component>
        <v-chip v-else v-bind="data.attrs" pill>
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
    <div v-else-if="item.inputType === 'value-array'" class="rounded-sm mb-4">
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
    <div
      v-else-if="
        item.inputType === 'stripe-cc' || item.inputType === 'stripe-pi'
      "
      class="pb-5 rounded-sm"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <div class="subtitle-1">
              {{
                item.inputOptions && item.inputOptions.getPrice
                  ? `Charge ${getStripeCcPrice()}`
                  : item.label + (item.optional ? ' (optional)' : '')
              }}
            </div>
            <div v-if="item.hint">{{ item.hint }}</div>
            <StripeElements
              v-if="item.inputType === 'stripe-cc'"
              :stripe-key="stripeKey"
              :instance-options="instanceOptions"
              :elements-options="elementsOptions"
              #default="{ elements }"
              ref="elms"
            >
              <StripeElement
                type="card"
                :elements="elements"
                :options="cardOptions"
                ref="card"
              />
            </StripeElements>
            <StripeElements
              v-if="item.inputType === 'stripe-pi'"
              :stripe-key="stripeKey"
              :instance-options="instanceOptionsComputed"
              :elements-options="elementsOptionsComputed"
              #default="{ elements }"
              ref="elms"
            >
              <StripeElement
                type="payment"
                :elements="elements"
                :options="cardOptions"
                ref="card"
                @ready="stripePiReady = true"
              />
            </StripeElements>
            <v-progress-linear
              v-if="item.loading"
              indeterminate
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div
      v-else-if="item.inputType === 'stripe-pi-editable'"
      class="pb-5 rounded-sm"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="tempInput"
              :label="item.label + (item.optional ? ' (optional)' : '')"
              filled
              dense
              class="py-0"
              :append-icon="tempInput ? 'mdi-close' : null"
              @click:append="clearStripePiEditable()"
              @blur="handleStripePiEditableUpdate()"
              @keyup.enter="handleStripePiEditableUpdate()"
            ></v-text-field>
            <div class="subtitle-1" v-if="item.inputValue">
              {{ `Charge ${formatAsCurrency(item.inputValue)}` }}
              <span v-if="item.inputValue < 0.5" class="red--text"
                >(Invalid Amount)</span
              >
            </div>
            <div v-if="item.hint">{{ item.hint }}</div>
            <v-progress-linear
              v-if="item.loading"
              indeterminate
            ></v-progress-linear>
            <StripeElements
              v-else-if="item.inputValue > 0 && item.inputData"
              :stripe-key="stripeKey"
              :instance-options="instanceOptionsComputed"
              :elements-options="elementsOptionsComputed"
              #default="{ elements }"
              ref="elms"
            >
              <StripeElement
                type="payment"
                :elements="elements"
                :options="cardOptions"
                ref="card"
                @ready="stripePiReady = true"
              />
            </StripeElements>
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
import {
  uploadFile,
  generateFileServingUrl,
  initializeFileUploadObject,
} from '~/services/file'
import {
  capitalizeString,
  isObject,
  handleError,
  getIcon,
  collectPaginatorData,
  addNestedInputObject,
  populateInputObject,
  generateDateLocaleString,
  formatAsCurrency,
} from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import FileChip from '~/components/chip/fileChip.vue'
import MediaChip from '~/components/chip/mediaChip.vue'
import { StripeElements, StripeElement } from 'vue-stripe-elements-plus'

export default {
  name: 'GenericInput',
  components: {
    Draggable,
    FileChip,
    MediaChip,
    StripeElements,
    StripeElement,
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
    selectedItem: {
      type: Object,
    },
  },

  data() {
    return {
      tempInput: null,
      filesData: [], // fileRecords
      filesProcessingQueue: null,

      dateTime: {
        dateInput: null,
        dateMenu: false,

        timeInput: null,
        timeMenu: null,
      },

      stripePiReady: false,

      stripeKey: process.env.stripePubKey,
      instanceOptions: {
        // https://stripe.com/docs/js/initializing#init_stripe_js-options
      },
      elementsOptions: {
        // https://stripe.com/docs/js/elements_object/create#stripe_elements-options
      },
      cardOptions: {
        layout: {
          type: 'tabs',
          defaultCollapsed: false,
        },

        // reactive
        // remember about Vue 2 reactivity limitations when dealing with options
        mode: 'payment',
        // https://stripe.com/docs/stripe.js#element-options
      },
    }
  },

  computed: {
    instanceOptionsComputed() {
      return this.item.inputData?.stripeAccount
        ? {
            ...this.instanceOptions,
            stripeAccount: this.item.inputData.stripeAccount,
          }
        : this.instanceOptions
    },

    elementsOptionsComputed() {
      // if inputData.clientSecret, merge it into the elementsOptions
      return this.item.inputData
        ? {
            ...this.elementsOptions,
            clientSecret: this.item.inputData.clientSecret,
            appearance: {
              theme: this.$vuetify.theme.dark ? 'night' : 'stripe',
            },
          }
        : this.elementsOptions
    },

    isReadonly() {
      return this.item.readonly
    },
    icon() {
      return getIcon(this.item.inputOptions?.typename)
    },

    fallbackIcon() {
      return this.item.inputOptions?.avatarOptions?.fallbackIcon
    },

    acceptedFiles() {
      return this.item.inputOptions?.contentType
    },

    limit() {
      return this.item.inputOptions?.limit
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

  created() {
    this.reset()
  },

  methods: {
    formatAsCurrency,
    getStripeCcPrice() {
      if (this.item.inputOptions?.getPrice) {
        return formatAsCurrency(
          this.item.inputOptions.getPrice(this, this.parentItem)
        )
      }
    },

    standardizeComboboxName(value) {
      // if it is not an object, will assume it is null or string
      return isObject(value) ? value.name : value
    },

    generateFileServingUrl,
    handleClear() {
      this.item.value = null
      this.tempInput = null
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

    // parse from date and time inputs to unixTimestamp
    handleDateTimeInputChange(val) {
      if (!val) {
        this.item.value = null
        return
      }

      const dateTimeMatch = this.tempInput.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
      )

      const years = Number(dateTimeMatch[1])
      const month = Number(dateTimeMatch[2])
      const day = Number(dateTimeMatch[3])

      const hours = Number(dateTimeMatch[4])
      const minutes = Number(dateTimeMatch[5])

      this.item.value =
        new Date(years, month - 1, day, hours, minutes, 0).getTime() / 1000
    },

    // val is expected to be unixTimestamp (s) or null
    syncDateTimePickerInput(val) {
      if (!val) {
        this.tempInput = null
        return
      }

      const dateObject = new Date(val * 1000)

      this.tempInput = `${dateObject.getFullYear()}-${String(
        dateObject.getMonth() + 1
      ).padStart(2, '0')}-${String(dateObject.getDate()).padStart(
        2,
        '0'
      )}T${String(dateObject.getHours()).padStart(2, '0')}:${String(
        dateObject.getMinutes()
      ).padStart(2, '0')}`
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

      // need to load the options
      populateInputObject(this, {
        inputObject: this.item,
        selectedItem: this.selectedItem,
        item: this.parentItem,
        loadOptions: true,
      })
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

    handleMultipleFileInputClear(inputObject, file) {
      const fileUploadObject =
        this.filesProcessingQueue.get(file).fileUploadObject

      const index = inputObject.inputValue.indexOf(fileUploadObject)

      if (index !== -1) {
        inputObject.inputValue[index].uploadTask.cancel()
        inputObject.inputValue.splice(index, 1)
      }

      // if no files left, set loading to false
      if (inputObject.inputValue.length < 1) {
        inputObject.loading = false
      }
    },

    handleMultipleDropFile(e) {
      if (!this.tempInput) this.tempInput = []

      this.tempInput.push(...Array.from(e.dataTransfer.files))

      this.handleMultipleFileInputChange(this.item)
    },

    handleDropEvent(e) {
      try {
        // if still loading, prevent
        if (this.item.loading) {
          throw new Error(`File upload already in progress`)
        }

        const files = Array.from(e.dataTransfer.files)

        // only 1 file allowed
        if (files.length !== 1) {
          throw new Error('Only 1 filed allowed to be dropped')
        }

        const firstFile = files[0]

        this.item.inputValue = initializeFileUploadObject(firstFile)

        this.handleSingleFileInputChange()
      } catch (err) {
        handleError(this, err)
      }
    },

    handleMultipleFileInputChange(inputObject, removeFromInput = true) {
      this.$set(inputObject, 'loading', true)
      try {
        // if the files processing + the files already uploaded >= limit, throw err and clear
        if (
          this.limit &&
          this.filesProcessingQueue.size + this.filesData.length >= this.limit
        ) {
          // also clear the files
          this.tempInput = []
          inputObject.loading = false
          throw new Error(`Adding these files would exceed the file limit`)
        }
        // tempInput expected to be array of Files
        this.tempInput.forEach((file) => {
          // add each file to the processing queue if the file is not already in there
          if (!this.filesProcessingQueue.has(file)) {
            this.filesProcessingQueue.set(file, {
              processed: false,
              fileUploadObject: initializeFileUploadObject(file),
            })
          }
        })

        // process each file in the processing queue if not already processing
        this.filesProcessingQueue.forEach((fileProcessObject, file) => {
          if (fileProcessObject.processed) return

          fileProcessObject.processed = true

          uploadFile(
            this,
            fileProcessObject.fileUploadObject,
            false,
            (fileUploadObject) => {
              // add finished fileRecord to filesData
              this.filesData.push(fileUploadObject.fileRecord)

              // remove file from input
              if (removeFromInput) {
                const index = this.tempInput.indexOf(file)
                if (index !== -1) this.tempInput.splice(index, 1)
              }

              // remove file from the queue by the key (filename)
              this.filesProcessingQueue.delete(file)

              // emit the file to parent (in case it is needed)
              this.$emit(
                'file-added',
                inputObject,
                fileProcessObject.fileUploadObject.fileRecord
              )

              // if no files left, finish up
              if (this.tempInput.length < 1) {
                inputObject.loading = false
                this.handleFilesDataUpdate()
                this.$notifier.showSnackbar({
                  message: 'File Uploaded',
                  variant: 'success',
                })
              }
            }
          )
        })
      } catch (err) {
        handleError(this, err)
      }
    },

    handleSingleFileInputClear(inputObject) {
      inputObject.value = null

      this.clearFileUploadQueue()

      inputObject.filesQueue = []
      inputObject.inputValue = null
      inputObject.loading = false
    },

    handleSingleFileInputChange(event = null) {
      const inputObject = this.item

      // if event, user clicked the upload button and the file will be extracted from the event object
      if (event) {
        const firstFile = event.target.files[0]

        // if no file, do nothing
        if (!firstFile) return

        inputObject.inputValue = initializeFileUploadObject(firstFile)
      }

      // if event is null, fileUploadObject should already be initialized

      if (!inputObject.inputValue) {
        this.handleSingleFileInputClear(inputObject)
        return
      }

      this.$set(inputObject, 'loading', true)

      this.clearFileUploadQueue()

      // reset the filesQueue
      inputObject.filesQueue = [inputObject.inputValue]

      // upload the file(s) to CDN, then load them into value on finish
      uploadFile(
        this,
        inputObject.inputValue,
        inputObject.inputOptions?.useFirebaseUrl === true,
        (fileUploadObject) => {
          if (inputObject.inputOptions?.useFirebaseUrl) {
            inputObject.value = fileUploadObject.url
          } else {
            inputObject.value = fileUploadObject.servingUrl
          }

          inputObject.loading = false

          // remove from filesQueue
          const index = inputObject.filesQueue.indexOf(fileUploadObject)
          if (index !== -1) inputObject.filesQueue.splice(index, 1)

          // emit the file to parent (in case it is needed)
          this.$emit('file-added', inputObject, fileUploadObject.fileRecord)

          this.$notifier.showSnackbar({
            message: 'File Uploaded',
            variant: 'success',
          })
        }
      )
    },

    async loadSearchResults(inputObject) {
      // if the value is empty, don't load results
      if (!inputObject.inputValue) return

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
                  avatarUrl: true,
                }),
              },
            },
            __args: {
              first: 20,
              search: {
                query: inputObject.inputValue,
                params: inputObject.fieldInfo.inputOptions?.searchParams?.(
                  this,
                  this.allItems
                ),
              },
              filterBy: [],
              sortBy: [],
              ...inputObject.fieldInfo.inputOptions?.lookupParams?.(
                this,
                this.allItems
              ),
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
          // fetch data if the type is a string
          if (typeof inputObject.value[0] === 'string') {
            // only proceed if parent item is defined
            if (this.parentItem) {
              const fileData = await collectPaginatorData(
                this,
                'getFilePaginator',
                {
                  id: true,
                  name: true,
                  size: true,
                  location: true,
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
          } else {
            // otherwise, it should have been pre-loaded
            this.filesData = inputObject.value
          }

          this.handleFilesDataUpdate()
        }
      } catch (err) {
        handleError(this, err)
      }
      inputObject.loading = false
    },

    async handleStripePiEditableUpdate() {
      this.item.loading = true
      this.stripePiReady = false
      try {
        // parse the tempInput into item.inputValue
        this.item.inputValue = Number(this.tempInput) || 0

        // min supported payment is $0.50
        if (this.item.inputValue < 0.5 && this.item.inputValue !== 0) {
          throw new Error(`Minimum payment amount is $0.50`)
        }

        // load the updated inputData (paymentIntent)
        this.item.inputData = await this.item.inputOptions.getPaymentIntent(
          this,
          this.item,
          this.selectedItem,
          this.item.inputValue
        )
      } catch (err) {
        handleError(this, err)
        // if there is an error, set the inputData to null
        this.item.inputData = null
      }
      this.item.loading = false
    },

    clearStripePiEditable() {
      this.tempInput = null
      this.handleStripePiEditableUpdate()
    },

    // logic to handle before submitting
    async beforeSubmit() {
      // if inputType is stripe-pi or stripe-pi-editable, process the payment at this point
      if (
        this.item.inputType === 'stripe-pi' ||
        this.item.inputType === 'stripe-pi-editable'
      ) {
        // for stripe-pi-editable, if amount is <= 0, don't process
        if (
          this.item.inputType === 'stripe-pi-editable' &&
          this.item.inputValue <= 0
        ) {
          this.item.value = null
          return
        }

        const groupComponent = this.$refs.elms

        // if the stripeElement has not finished loading yet, throw err
        if (!groupComponent || !this.stripePiReady) {
          throw new Error(`Card component not finished loading`)
        }

        // Trigger form validation and wallet collection
        const { error: submitError } = await groupComponent.elements.submit()

        if (submitError) {
          throw new Error(submitError.message)
        }

        const res = await groupComponent.instance.confirmPayment({
          elements: groupComponent.elements,
          clientSecret: this.item.inputData.clientSecret,
          confirmParams: {
            return_url: window.location.href,
          },

          // Uncomment below if you only want redirect for redirect-based payments
          redirect: 'if_required',
        })

        this.item.value = res.paymentIntent.id
      } else if (this.item.inputType === 'stripe-cc') {
        const groupComponent = this.$refs.elms
        const cardComponent = this.$refs.card
        // Get stripe element
        const cardElement = cardComponent.stripeElement

        // Access instance methods, e.g. createToken()

        const result = await groupComponent.instance.createToken(cardElement)

        if (result.token) {
          this.item.value = result.token.id
        } else if (result.error) {
          throw new Error(result.error.message)
        }
      }
    },

    clearFileUploadQueue() {
      if (this.item.filesQueue) {
        // cancel any existing file uploads, clear out file queue
        this.item.filesQueue.forEach((fileUploadObject) => {
          fileUploadObject.uploadTask?.cancel()
        })
      }
    },

    renderFileUploadProgress(file) {
      return (
        this.filesProcessingQueue
          .get(file)
          ?.fileUploadObject.progress.toFixed(1) ?? null
      )
    },

    reset() {
      switch (this.item.inputType) {
        case 'multiple-file':
          this.filesData = []
          this.filesProcessingQueue = new Map()
          this.loadFiles(this.item)
          break
        case 'datepicker':
          // if the value is a number, transform it into string
          if (!isNaN(Number(this.item.value))) {
            this.item.value = generateDateLocaleString(this.item.value)
          }
          this.syncDatePickerInput(this.item.inputValue)
          break
        case 'datetimepicker':
          // this.item.value is expected to be a unixTimestamp or null
          this.syncDateTimePickerInput(this.item.value)
          break
        case 'stripe-pi-editable':
          this.tempInput = this.item.inputValue
          break
      }
    },
  },

  beforeDestroy() {
    // before destroy, need to terminate any file upload tasks, if any
    this.clearFileUploadQueue()
  },
}
</script>
<style scoped>
.custom-file-upload {
  display: inline-block;
  padding: 6px 12px;
  cursor: pointer;
}
</style>
