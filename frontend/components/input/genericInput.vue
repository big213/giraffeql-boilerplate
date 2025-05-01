<template>
  <div>
    <v-text-field
      v-if="
        !inputObject.inputDefinition.inputType ||
        inputObject.inputDefinition.inputType === 'text'
      "
      v-model="inputObject.value"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :rules="inputObject.inputDefinition.inputRules"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      persistent-hint
      filled
      dense
      class="py-0"
      v-bind="inputParams"
      v-on="$listeners"
      @click:append="handleClear()"
      @keyup.enter="triggerSubmit()"
      @click:append-outer="handleClose()"
      @input="triggerInput()"
    ></v-text-field>
    <div
      v-else-if="inputObject.inputDefinition.inputType === 'html'"
      class="mb-4"
      style="background-color: white; color: black"
    >
      <wysiwyg v-model="inputObject.value" />
    </div>
    <div
      v-else-if="inputObject.inputDefinition.inputType === 'multiple-file'"
      class="mb-4 text-left highlighted-bg"
    >
      <v-container v-if="filesData.length">
        <Draggable
          v-model="filesData"
          class="row"
          :disabled="inputObject.readonly"
          @change="handleFilesDataUpdate()"
        >
          <v-col
            v-for="(file, index) in filesData"
            :key="file.id"
            cols="12"
            class="py-2"
            :sm="inputObject.inputDefinition.mediaMode ? 3 : 6"
          >
            <MediaChip
              v-if="inputObject.inputDefinition.mediaMode"
              :file="file"
              draggable
              close
              openable
              :readonly="inputObject.readonly"
              :use-firebase-url="inputObject.inputDefinition.useFirebaseUrl"
              @handleCloseClick="removeFileByIndex(index)"
            ></MediaChip>
            <FileChip
              v-else
              :file="file"
              downloadable
              small
              label
              :close="!inputObject.readonly"
              close-icon="mdi-close-outline"
              class="mr-2"
              @handleCloseClick="removeFileByIndex(index)"
            ></FileChip>
          </v-col>
        </Draggable>
      </v-container>
      <div v-cloak @drop.prevent="handleMultipleDropFile" @dragover.prevent>
        <v-file-input
          v-model="tempInput"
          :label="`${inputObject.label} (Drag and Drop)${
            inputObject.inputDefinition.optional ? ` (optional)` : ''
          }${
            inputObject.inputDefinition.limit
              ? ` (Limit ${inputObject.inputDefinition.limit})`
              : ''
          }`"
          multiple
          :accept="acceptedFiles"
          :hint="inputObject.inputDefinition.hint"
          :loading="inputObject.loading"
          persistent-hint
          :clearable="false"
          @change="handleMultipleFileInputChange"
        >
          <template v-slot:selection="{ file, text }">
            <v-chip
              small
              label
              color="primary"
              close
              close-icon="mdi-close-outline"
              @click:close="handleMultipleFileInputClear(file)"
            >
              {{ text }}
              <v-progress-circular
                indeterminate
                class="ml-2"
                size="12"
              ></v-progress-circular>
            </v-chip>
          </template>
        </v-file-input>
      </div>
    </div>
    <div
      v-else-if="inputObject.inputDefinition.inputType === 'single-file-url'"
      class="mb-4 highlighted-bg"
      :class="isReadonly ? 'text-center' : 'd-flex text-left'"
      v-cloak
      @drop.prevent="handleDropEvent"
      @dragover.prevent
    >
      <label
        v-if="!inputObject.loading"
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
        <v-progress-circular :value="inputObject.inputValue.progress" size="48"
          >{{
            inputObject.inputValue.progress.toFixed(0)
          }}%</v-progress-circular
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
        v-model="inputObject.value"
        :label="`${inputObject.label}${
          inputObject.inputDefinition.optional ? ` (optional)` : ''
        }`"
        :readonly="isReadonly"
        :rules="inputObject.inputDefinition.inputRules"
        :hint="inputObject.inputDefinition.hint"
        :disabled="inputObject.loading"
        :loading="inputObject.loading"
        :append-icon="appendIcon"
        :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
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
      v-else-if="inputObject.inputDefinition.inputType === 'single-image-url'"
      class="mb-4 highlighted-bg text-center"
      v-cloak
      @drop.prevent="handleDropEvent"
      @dragover.prevent
    >
      <div
        v-if="
          !inputObject.inputDefinition ||
          (!inputObject.inputDefinition.avatarOptions && inputObject.value)
        "
        class="pt-2"
      >
        <v-img :src="inputObject.value" contain max-height="200"></v-img>
      </div>
      <div class="d-flex text-left pt-2">
        <v-avatar
          v-if="
            inputObject.inputDefinition &&
            inputObject.inputDefinition.avatarOptions
          "
          size="64"
        >
          <v-img v-if="inputObject.value" :src="inputObject.value"></v-img>
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
          v-model="inputObject.value"
          :label="`${inputObject.label}${
            inputObject.inputDefinition.optional ? ` (optional)` : ''
          }`"
          :readonly="isReadonly"
          :rules="inputObject.inputDefinition.inputRules"
          :hint="inputObject.inputDefinition.hint"
          :loading="inputObject.loading"
          :append-icon="appendIcon"
          :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
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
      v-else-if="inputObject.inputDefinition.inputType === 'textarea'"
      v-model="inputObject.value"
      filled
      rows="3"
      dense
      class="py-0"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    ></v-textarea>
    <v-switch
      v-else-if="inputObject.inputDefinition.inputType === 'switch'"
      v-model="inputObject.value"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    ></v-switch>
    <v-checkbox
      v-else-if="inputObject.inputDefinition.inputType === 'checkbox'"
      v-model="inputObject.value"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    ></v-checkbox>
    <v-menu
      v-else-if="inputObject.inputDefinition.inputType === 'datepicker'"
      v-model="inputObject.focused"
      :close-on-content-click="false"
      :nudge-right="40"
      transition="scale-transition"
      offset-y
      min-width="290px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          v-model="inputObject.value"
          :label="`${inputObject.label}${
            inputObject.inputDefinition.optional ? ` (optional)` : ''
          }`"
          :readonly="isReadonly"
          :append-icon="appendIcon"
          :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
          :hint="inputObject.inputDefinition.hint"
          :loading="inputObject.loading"
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
        @input="inputObject.focused = false"
        @change="applyDatePickerInput"
      ></v-date-picker>
    </v-menu>
    <v-text-field
      v-else-if="inputObject.inputDefinition.inputType === 'datetimepicker'"
      v-model="tempInput"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :rules="inputObject.inputDefinition.inputRules"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
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
      v-else-if="inputObject.inputDefinition.inputType === 'type-combobox'"
      ref="combobox"
      v-model="inputObject.value"
      :search-input.sync="inputObject.inputValue"
      :items="inputObject.options"
      :item-text="inputObject.inputDefinition.entity?.nameField"
      item-value="id"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      filled
      hide-no-data
      :no-filter="
        !inputObject.inputDefinition.getOptions ||
        inputObject.inputDefinition.loadServerResults
      "
      class="py-0"
      :chips="!!inputObject.inputDefinition.entity"
      v-on="$listeners"
      @update:search-input="handleSearchUpdate(inputObject)"
      @blur="inputObject.focused = false"
      @focus="inputObject.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template v-slot:item="data">
        <InputSelectionChip
          :input-object="inputObject"
          :item="data.item"
        ></InputSelectionChip>
      </template>
      <template v-slot:selection="data">
        <InputSelectionChip
          :input-object="inputObject"
          :item="data.item"
        ></InputSelectionChip>
      </template>
    </v-combobox>
    <v-autocomplete
      v-else-if="
        inputObject.inputDefinition.inputType === 'type-autocomplete' ||
        inputObject.inputDefinition.inputType === 'type-autocomplete-multiple'
      "
      v-model="inputObject.value"
      :search-input.sync="inputObject.inputValue"
      :items="inputObject.options"
      :multiple="
        inputObject.inputDefinition.inputType === 'type-autocomplete-multiple'
      "
      :item-text="inputObject.inputDefinition.entity.nameField"
      item-value="id"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      filled
      hide-no-data
      return-object
      :no-filter="
        !inputObject.inputDefinition.getOptions ||
        inputObject.inputDefinition.loadServerResults
      "
      class="py-0"
      :chips="!!inputObject.inputDefinition.entity"
      v-on="$listeners"
      @update:search-input="handleSearchUpdate(inputObject)"
      @blur="inputObject.focused = false"
      @focus="inputObject.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template v-slot:item="data">
        <InputSelectionChip
          :input-object="inputObject"
          :item="data.item"
        ></InputSelectionChip>
      </template>
      <template v-slot:selection="data">
        <InputSelectionChip
          :input-object="inputObject"
          :item="data.item"
        ></InputSelectionChip>
      </template>
    </v-autocomplete>
    <v-autocomplete
      v-else-if="inputObject.inputDefinition.inputType === 'text-autocomplete'"
      v-model="inputObject.value"
      :search-input.sync="inputObject.inputValue"
      :items="inputObject.options"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      filled
      hide-no-data
      return-object
      :no-filter="
        !inputObject.inputDefinition.getOptions ||
        inputObject.inputDefinition.loadServerResults
      "
      class="py-0"
      v-on="$listeners"
      @update:search-input="handleSearchUpdate(inputObject)"
      @blur="inputObject.focused = false"
      @focus="inputObject.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
    </v-autocomplete>
    <v-combobox
      v-else-if="inputObject.inputDefinition.inputType === 'text-combobox'"
      ref="combobox"
      v-model="inputObject.value"
      :search-input.sync="inputObject.inputValue"
      :items="inputObject.options"
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      filled
      hide-no-data
      :no-filter="
        !inputObject.inputDefinition.getOptions ||
        inputObject.inputDefinition.loadServerResults
      "
      class="py-0"
      v-on="$listeners"
      @update:search-input="handleSearchUpdate(inputObject)"
      @blur="inputObject.focused = false"
      @focus="inputObject.focused = true"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
    </v-combobox>
    <v-select
      v-else-if="
        inputObject.inputDefinition.inputType === 'select' ||
        inputObject.inputDefinition.inputType === 'multiple-select'
      "
      v-model="inputObject.value"
      :items="inputObject.options"
      :multiple="inputObject.inputDefinition.inputType === 'multiple-select'"
      filled
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      return-object
      item-text="name"
      item-value="id"
      class="py-0"
      :chips="!!inputObject.inputDefinition.entity"
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
      <template v-slot:item="data">
        <InputSelectionChip
          :input-object="inputObject"
          :item="data.item"
        ></InputSelectionChip>
      </template>
      <template v-slot:selection="data">
        <InputSelectionChip
          :input-object="inputObject"
          :item="data.item"
        ></InputSelectionChip>
      </template>
    </v-select>
    <v-select
      v-else-if="inputObject.inputDefinition.inputType === 'boolean-select'"
      v-model="inputObject.value"
      :items="[
        { text: 'Yes', value: true },
        { text: 'No', value: false },
      ]"
      filled
      :label="`${inputObject.label}${
        inputObject.inputDefinition.optional ? ` (optional)` : ''
      }`"
      :readonly="isReadonly"
      :append-icon="appendIcon"
      :append-outer-icon="inputObject.closeable ? 'mdi-close' : null"
      :hint="inputObject.inputDefinition.hint"
      :loading="inputObject.loading"
      persistent-hint
      item-text="text"
      item-value="value"
      class="py-0"
      v-on="$listeners"
      @click:append="handleClear()"
      @click:append-outer="handleClose()"
    >
    </v-select>
    <div
      v-else-if="inputObject.inputDefinition.inputType === 'value-array'"
      class="rounded-sm mb-4"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <div class="subtitle-1">
              {{
                `${inputObject.label}${
                  inputObject.inputDefinition.optional ? ` (optional)` : ''
                }`
              }}
            </div>
            <div v-if="inputObject.inputDefinition.hint">
              {{ inputObject.inputDefinition.hint }}
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <div v-if="inputObject.nestedInputsArray.length > 0">
              <Draggable
                v-model="inputObject.nestedInputsArray"
                :disabled="inputObject.readonly"
              >
                <v-row
                  v-for="(nestedInputArray, i) in inputObject.nestedInputsArray"
                  :key="i"
                  class="highlighted-bg"
                >
                  <v-col cols="12" class="pa-0 pb-1" key="-1">
                    <v-system-bar lights-out>
                      <v-icon @click="void 0">mdi-arrow-all</v-icon>
                      {{
                        inputObject.inputDefinition.nestedOptions.entryName ??
                        'Entry'
                      }}
                      #{{ i + 1 }}
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
                      :input-object="nestedInputObject.inputObject"
                    ></GenericInput>
                  </v-col>
                </v-row>
              </Draggable>
            </div>
            <div v-else class="pb-3">
              No
              {{
                inputObject.inputDefinition.nestedOptions.pluralEntryName ??
                'Entries'
              }}
            </div>
          </v-col>
        </v-row>
        <v-row v-if="!isReadonly" @click="addRow()">
          <v-col cols="12" class="pa-0">
            <v-btn small block>
              <v-icon left>mdi-plus</v-icon>
              Add
              {{
                inputObject.inputDefinition.nestedOptions.entryName ?? 'Entry'
              }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div
      v-else-if="
        inputObject.inputDefinition.inputType === 'stripe-cc' ||
        inputObject.inputDefinition.inputType === 'stripe-pi'
      "
      class="pb-5 rounded-sm"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <div
              v-if="renderDiscountScheme().length > 0"
              class="subtitle-1 mb-2"
            >
              Buy more and save!
              <div>{{ renderDiscountScheme() }}</div>
            </div>
            <v-text-field
              v-if="inputObject.inputDefinition.paymentOptions.quantityOptions"
              v-model="inputObject.secondaryInputValue"
              label="Quantity"
              type="number"
              min="1"
              filled
              dense
              class="py-0"
              @blur="handleStripePiQuantityUpdate()"
              @keyup.enter="handleStripePiQuantityUpdate()"
            ></v-text-field>
            <div class="subtitle-1 mb-2 text-left">
              {{ renderPrice() }}
              <span v-if="renderDiscount()" class="red--text"
                >-- {{ renderDiscount() }}</span
              >
            </div>
            <div v-if="inputObject.inputDefinition.hint">
              {{ inputObject.inputDefinition.hint }}
            </div>
            <StripeElements
              v-if="inputObject.inputDefinition.inputType === 'stripe-cc'"
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
            <v-progress-linear
              v-if="inputObject.loading"
              indeterminate
            ></v-progress-linear>
            <div
              v-else-if="inputObject.inputDefinition.inputType === 'stripe-pi'"
            >
              <StripeElements
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
              <div v-if="stripePiReady" class="mt-5">
                <v-btn color="primary" block @click="triggerSubmit()"
                  >Buy</v-btn
                >
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row v-if="hasPaypal">
          <v-col cols="12" class="py-0">
            <v-divider></v-divider>
            <div
              :id="`paypal-button-container-${$vnode.key}`"
              class="mt-3"
            ></div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div
      v-else-if="inputObject.inputDefinition.inputType === 'stripe-pi-editable'"
      class="pb-5 rounded-sm"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="tempInput"
              :label="`${inputObject.label}${
                inputObject.inputDefinition.optional ? ` (optional)` : ''
              }`"
              filled
              dense
              class="py-0"
              :append-icon="tempInput ? 'mdi-close' : null"
              @click:append="clearStripePiEditable()"
              @blur="handleStripePiEditableUpdate()"
              @keyup.enter="handleStripePiEditableUpdate()"
            ></v-text-field>
            <div class="subtitle-1 mb-3" v-if="inputObject.inputValue">
              {{ `Charge ${formatAsCurrency(inputObject.inputValue)}` }}
              <span v-if="inputObject.inputValue < 0.5" class="red--text"
                >(Invalid Amount)</span
              >
            </div>
            <div v-if="inputObject.inputDefinition.hint">
              {{ inputObject.inputDefinition.hint }}
            </div>
            <v-progress-linear
              v-if="inputObject.loading"
              indeterminate
            ></v-progress-linear>
            <StripeElements
              v-else-if="inputObject.inputValue > 0 && inputObject.inputData"
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
    <div
      v-else-if="inputObject.inputDefinition.inputType === 'rating'"
      class="rounded-sm mb-4"
    >
      <v-container class="highlighted-bg">
        <v-row>
          <v-col cols="12">
            <div class="subtitle-1">
              {{
                `${inputObject.label}${
                  inputObject.inputDefinition.optional ? ` (optional)` : ''
                }`
              }}
            </div>
            <div v-if="inputObject.inputDefinition.hint">
              {{ inputObject.inputDefinition.hint }}
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="pt-0">
            <v-rating
              v-model="inputObject.value"
              length="5"
              color="yellow darken-2"
              background-color="grey lighten-1"
              large
            ></v-rating>
          </v-col>
        </v-row>
      </v-container>
    </div>
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
  isObject,
  handleError,
  collectPaginatorData,
  addNestedInputObject,
  populateInputObject,
  generateDateLocaleString,
  formatAsCurrency,
  loadTypeSearchResults,
  parseDiscountScheme,
} from '~/services/base'
import FileChip from '~/components/chip/fileChip.vue'
import MediaChip from '~/components/chip/mediaChip.vue'
import InputSelectionChip from '~/components/chip/inputSelectionChip.vue'
import { StripeElements, StripeElement } from 'vue-stripe-elements-plus'
import { hideNullInputIcon, paypalClientId } from '~/config'

export default {
  name: 'GenericInput',
  components: {
    Draggable,
    FileChip,
    MediaChip,
    InputSelectionChip,
    StripeElements,
    StripeElement,
  },
  props: {
    // type: CrudInputObject
    inputObject: {
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
    hasPaypal() {
      return (
        !!paypalClientId &&
        this.inputObject.inputDefinition.paymentOptions.paypalOptions
      )
    },

    instanceOptionsComputed() {
      return this.inputObject.inputData?.stripeAccount
        ? {
            ...this.instanceOptions,
            stripeAccount: this.inputObject.inputData.stripeAccount,
          }
        : this.instanceOptions
    },

    elementsOptionsComputed() {
      // if inputData.clientSecret, merge it into the elementsOptions
      return this.inputObject.inputData
        ? {
            ...this.elementsOptions,
            clientSecret: this.inputObject.inputData.clientSecret,
            appearance: {
              theme: this.$vuetify.theme.dark ? 'night' : 'stripe',
            },
          }
        : this.elementsOptions
    },

    isReadonly() {
      return this.inputObject.readonly
    },

    fallbackIcon() {
      return this.inputObject.inputDefinition.avatarOptions?.fallbackIcon
    },

    acceptedFiles() {
      return this.inputObject.inputDefinition.contentType
    },

    appendIcon() {
      return this.inputObject.value === null
        ? hideNullInputIcon
          ? null
          : 'mdi-null'
        : this.isReadonly
        ? null
        : 'mdi-close'
    },

    inputParams() {
      return this.inputObject.inputDefinition.inputParams
    },
  },

  watch: {
    'inputObject.generation'() {
      this.reset()
    },
  },

  created() {
    this.reset()
  },

  mounted() {
    if (
      this.inputObject.inputDefinition.inputType === 'stripe-pi' &&
      this.hasPaypal
    ) {
      this.renderPayPal()
    }
  },

  methods: {
    formatAsCurrency,

    async createPaypalOrder() {
      try {
        const priceObject = this.getPriceObject()
        const orderData =
          await this.inputObject.inputDefinition.paymentOptions.paypalOptions.createPaypalOrder(
            this,
            this.inputObject,
            this.parentItem,
            priceObject.quantity,
            priceObject.price
          )

        if (orderData.id) {
          return orderData.id
        } else {
          const errorDetail = orderData?.details?.[0]
          const errorMessage = errorDetail
            ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
            : JSON.stringify(orderData)

          throw new Error(errorMessage)
        }
      } catch (err) {
        handleError(this, err)
      }
    },

    async capturePaypalOrder(data, actions) {
      try {
        const orderData =
          await this.inputObject.inputDefinition.paymentOptions.paypalOptions.capturePaypalOrder(
            data.orderID
          )

        // Three cases to handle:
        //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
        //   (2) Other non-recoverable errors -> Show a failure message
        //   (3) Successful transaction -> Show confirmation or thank you message

        const errorDetail = orderData?.details?.[0]

        if (errorDetail?.issue === 'INSTRUMENT_DECLINED') {
          // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
          // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
          return actions.restart()
        } else if (errorDetail) {
          // (2) Other non-recoverable errors -> Show a failure message
          throw new Error(`${errorDetail.description} (${orderData.debug_id})`)
        } else if (!orderData.purchase_units) {
          throw new Error(JSON.stringify(orderData))
        } else {
          // (3) Successful transaction -> Show confirmation or thank you message
          // Or go to another URL:  actions.redirect('thank_you.html');

          // succeeded, so will now submit
          this.inputObject.value = `paypal_${data.orderID}`
          this.triggerSubmit()
        }
      } catch (err) {
        handleError(this, err)
      }
    },

    renderPayPal() {
      window.paypal
        .Buttons({
          style: {
            shape: 'rect',
            layout: 'horizontal',
          },
          message: {
            color: this.$vuetify.theme.dark ? 'white' : 'black',
          },
          createOrder: this.createPaypalOrder,
          onApprove: this.capturePaypalOrder,
        })
        .render(`#paypal-button-container-${this.$vnode.key}`)
    },
    renderDiscountScheme() {
      return parseDiscountScheme(
        this.inputObject.inputDefinition.paymentOptions.quantityOptions?.getDiscountScheme?.(
          this,
          this.parentItem
        )
      )
        .map(
          (item) => `Buy ${inputObject.quantity}, Save ${inputObject.discount}%`
        )
        .join(' | ')
    },

    renderPrice() {
      const priceObject = this.getPriceObject()

      if (!priceObject) return null

      return `Grand Total ${formatAsCurrency(
        priceObject.price - (priceObject.discount ?? 0)
      )}${priceObject.quantity ? ` (Quantity ${priceObject.quantity})` : ''}`
    },

    renderDiscount() {
      const priceObject = this.getPriceObject()

      if (!priceObject) return null

      return priceObject.discount
        ? `you saved ${formatAsCurrency(priceObject.discount)} (${
            priceObject.discountPercent
          }%)!`
        : null
    },

    getPriceObject() {
      return this.inputObject.inputDefinition.paymentOptions?.getPriceObject?.(
        this,
        this.parentItem,
        this.inputObject.secondaryInputValue,
        this.inputObject.inputDefinition.paymentOptions.quantityOptions?.getDiscountScheme?.(
          this,
          this.parentItem
        )
      )
    },

    standardizeComboboxName(value) {
      // if it is not an object, will assume it is null or string
      return isObject(value) ? value.name : value
    },

    generateFileServingUrl,
    handleClear() {
      this.inputObject.value = null
      this.tempInput = null
      this.$emit('change', this.inputObject.value)
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
      this.inputObject.value = val
      this.$emit('change', this.inputObject.value)
    },

    // parse from date and time inputs to unixTimestamp
    handleDateTimeInputChange(_val) {
      if (!this.tempInput) {
        this.inputObject.value = null
        return
      }

      // always set the input to the start of the day (only if the current input is null
      // no longer doing this
      /*
      if (!this.inputObject.value) {
        this.tempInput = this.tempInput.replace(/T(\d{2}):(\d{2})$/, 'T00:00')
      }
      */

      const dateTimeMatch = this.tempInput.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
      )

      const years = Number(dateTimeMatch[1])
      const month = Number(dateTimeMatch[2])
      const day = Number(dateTimeMatch[3])

      const hours = Number(dateTimeMatch[4])
      const minutes = Number(dateTimeMatch[5])

      this.inputObject.value =
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
      addNestedInputObject(this, this.inputObject)

      // need to load the options
      populateInputObject(this, {
        inputObject: this.inputObject,
        parentItem: this.parentItem,
        fetchEntities: true,
      })
    },

    removeRow(index) {
      this.inputObject.nestedInputsArray.splice(index, 1)
    },

    handleSearchUpdate(inputObject) {
      try {
        // if getOptions already provided, no need to handle this
        if (
          inputObject.inputDefinition.getOptions &&
          !inputObject.inputDefinition.loadServerResults
        )
          return

        // if empty input, don't do the update
        if (!inputObject.inputValue) return

        // if inputObject is object and search === value.name, or if the value is equal to inputValue, skip (this usually happens when an item is selected, and it will trigger this function again)
        if (
          inputObject.inputValue === inputObject.value ||
          (isObject(inputObject.value) &&
            inputObject.inputValue === inputObject.value.name)
        ) {
          return
        }

        // if the input type does not have a name, do a slightly different check
        if (
          !inputObject.inputDefinition.entity.nameField &&
          (inputObject.value?.id ?? null) === inputObject.inputValue
        ) {
          return
        }

        // cancel pending call, if any
        clearTimeout(this._timerId)

        // if it is a text-autocomplete/combobox type and no getSuggestions function, throw err
        if (
          inputObject.inputDefinition.inputType === 'text-autocomplete' ||
          (inputObject.inputDefinition.inputType === 'text-combobox' &&
            !inputObject.inputDefinition.getSuggestions)
        ) {
          throw new Error(`getSuggestions function required`)
        }

        // set the load search result function if it is a text-autocomplete type
        const loadSearchResultsFn =
          inputObject.inputDefinition.getSuggestions ?? loadTypeSearchResults

        // delay new call 500ms
        this._timerId = setTimeout(async () => {
          inputObject.loading = true
          try {
            inputObject.options = await loadSearchResultsFn(this, inputObject)
          } catch (err) {
            handleError(this, err)
          }
          inputObject.loading = false
        }, 500)
      } catch (err) {
        handleError(this, err)
      }
    },

    removeFileByIndex(index) {
      this.filesData.splice(index, 1)

      this.handleFilesDataUpdate()
    },

    handleFilesDataUpdate() {
      this.inputObject.value = this.filesData.map((ele) => ele.id)
    },

    handleMultipleFileInputClear(file) {
      // fetch the file object
      const fileUploadObject =
        this.filesProcessingQueue.get(file).fileUploadObject

      // if not exists for some reason, do nothing
      if (!fileUploadObject) return

      // cancel the upload task
      fileUploadObject.uploadTask.cancel()

      // remove from the tempInputs
      const index = this.tempInput.indexOf(fileUploadObject.file)

      if (index !== -1) {
        this.tempInput.splice(index, 1)
      }

      // remove from filesProcessingQueue
      this.filesProcessingQueue.delete(file)

      // if no files left, set loading to false
      if (this.filesProcessingQueue.size < 1) {
        this.inputObject.loading = false
      }
    },

    handleMultipleDropFile(e) {
      const newFiles = Array.from(e.dataTransfer.files)

      // process the files queue
      this.processFilesQueue(newFiles)
    },

    handleDropEvent(e) {
      try {
        // if still loading, prevent
        if (this.inputObject.loading) {
          throw new Error(`File upload already in progress`)
        }

        const files = Array.from(e.dataTransfer.files)

        // only 1 file allowed
        if (files.length !== 1) {
          throw new Error('Only 1 filed allowed to be dropped')
        }

        const firstFile = files[0]

        this.inputObject.inputValue = initializeFileUploadObject(firstFile)

        this.handleSingleFileInputChange()
      } catch (err) {
        handleError(this, err)
      }
    },

    handleMultipleFileInputChange(files) {
      this.processFilesQueue(files)
    },

    processFilesQueue(newFiles) {
      try {
        // if the files processing + the files already uploaded + # of new files >= limit, throw err and clear
        const limit = this.inputObject.inputDefinition.limit
        if (
          limit &&
          this.filesProcessingQueue.size +
            this.filesData.length +
            newFiles.length >
            limit
        ) {
          this.inputObject.loading = false
          // clear the temp input
          this.tempInput = []
          throw new Error(`Adding these files would exceed the file limit`)
        }

        newFiles.forEach((file) => {
          if (!this.filesProcessingQueue.has(file)) {
            this.filesProcessingQueue.set(file, {
              processed: false,
              fileUploadObject: initializeFileUploadObject(file),
            })
          }
        })

        // sync the inputs
        this.tempInput = [...this.filesProcessingQueue.keys()]

        // process each file in the processing queue if not already processing
        this.filesProcessingQueue.forEach((fileProcessObject, file) => {
          if (fileProcessObject.processed) return

          this.$set(this.inputObject, 'loading', true)

          fileProcessObject.processed = true

          uploadFile(
            this,
            fileProcessObject.fileUploadObject,
            this.inputObject.inputDefinition.useFirebaseUrl,
            (fileUploadObject) => {
              // add finished fileRecord to filesData
              this.filesData.push(fileUploadObject.fileRecord)

              // remove file from input
              const index = this.tempInput.indexOf(file)
              if (index !== -1) this.tempInput.splice(index, 1)

              // remove file from the queue by the key (filename)
              this.filesProcessingQueue.delete(file)

              // emit the file to parent (in case it is needed)
              this.$emit(
                'file-added',
                this.inputObject,
                fileProcessObject.fileUploadObject.fileRecord
              )

              // if no files left, finish up
              if (this.tempInput.length < 1) {
                this.inputObject.loading = false
                this.handleFilesDataUpdate()
                this.$root.$emit('showSnackbar', {
                  message: `File Uploaded`,
                  color: 'success',
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
      const inputObject = this.inputObject

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
        inputObject.inputDefinition.useFirebaseUrl === true,
        (fileUploadObject) => {
          if (inputObject.inputDefinition.useFirebaseUrl) {
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

          this.$root.$emit('showSnackbar', {
            message: `File Uploaded`,
            color: 'success',
          })
        }
      )
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

    async handleStripePiQuantityUpdate() {
      const priceObject = this.getPriceObject()

      // if temp data not set, set it and return
      if (!this._tempData) {
        this._tempData = JSON.stringify(priceObject)
      } else if (this._tempData === JSON.stringify(priceObject)) {
        // if the quantity + price combination is the same
        return
      }

      this.inputObject.loading = true
      this.stripePiReady = false
      try {
        // update the inputValue
        this.inputObject.inputValue = priceObject.price

        // min supported payment is $0.50
        if (
          this.inputObject.inputValue < 0.5 &&
          this.inputObject.inputValue !== 0
        ) {
          throw new Error(`Minimum payment amount is $0.50`)
        }

        // storing the params in temp data to check against
        this._tempData = JSON.stringify(priceObject)

        // load the updated inputData (paymentIntent)
        this.inputObject.inputData =
          await this.inputObject.inputDefinition.paymentOptions.getPaymentIntent(
            this,
            this.inputObject,
            this.parentItem,
            priceObject.quantity,
            priceObject.price
          )
      } catch (err) {
        handleError(this, err)
        // if there is an error, set the inputData to null
        this.inputObject.inputData = null
      }
      this.inputObject.loading = false
    },

    async handleStripePiEditableUpdate() {
      this.inputObject.loading = true
      this.stripePiReady = false
      try {
        // parse the tempInput into inputObject.inputValue
        this.inputObject.inputValue = Number(this.tempInput) || 0

        // min supported payment is $0.50
        if (
          this.inputObject.inputValue < 0.5 &&
          this.inputObject.inputValue !== 0
        ) {
          throw new Error(`Minimum payment amount is $0.50`)
        }

        // load the updated inputData (paymentIntent)
        this.inputObject.inputData =
          await this.inputObject.inputDefinition.paymentOptions.getPaymentIntent(
            this,
            this.inputObject,
            this.parentItem,
            undefined,
            this.inputObject.inputValue
          )
      } catch (err) {
        handleError(this, err)
        // if there is an error, set the inputData to null
        this.inputObject.inputData = null
      }
      this.inputObject.loading = false
    },

    clearStripePiEditable() {
      this.tempInput = null
      this.handleStripePiEditableUpdate()
    },

    // logic to handle before submitting
    async beforeSubmit() {
      // if inputType is stripe-pi or stripe-pi-editable, process the payment at this point
      if (
        this.inputObject.inputDefinition.inputType === 'stripe-pi' ||
        this.inputObject.inputDefinition.inputType === 'stripe-pi-editable'
      ) {
        // if the value is already set, this must be due to having captured a paypal payment already, so will skip
        if (this.inputObject.value) return

        // for stripe-pi-editable, if amount is <= 0, don't process
        if (
          this.inputObject.inputDefinition.inputType === 'stripe-pi-editable' &&
          this.inputObject.inputValue <= 0
        ) {
          this.inputObject.value = null
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
          clientSecret: this.inputObject.inputData.clientSecret,
          confirmParams: {
            return_url: window.location.href,
          },

          // Uncomment below if you only want redirect for redirect-based payments
          redirect: 'if_required',
        })

        if (res.error) {
          throw new Error(res.error.message)
        }

        this.inputObject.value = res.paymentIntent.id
      } else if (this.inputObject.inputDefinition.inputType === 'stripe-cc') {
        const groupComponent = this.$refs.elms
        const cardComponent = this.$refs.card
        // Get stripe element
        const cardElement = cardComponent.stripeElement

        // Access instance methods, e.g. createToken()

        const result = await groupComponent.instance.createToken(cardElement)

        if (result.token) {
          this.inputObject.value = result.token.id
        } else if (result.error) {
          throw new Error(result.error.message)
        }
      }
    },

    clearFileUploadQueue() {
      if (this.inputObject.filesQueue) {
        // cancel any existing file uploads, clear out file queue
        this.inputObject.filesQueue.forEach((fileUploadObject) => {
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
      switch (this.inputObject.inputDefinition.inputType) {
        case 'multiple-file':
          this.filesData = []
          this.tempInput = []
          this.filesProcessingQueue = new Map()
          this.loadFiles(this.inputObject)
          break
        case 'datepicker':
          // if the value is a number, transform it into string
          if (!isNaN(Number(this.inputObject.value))) {
            this.inputObject.value = generateDateLocaleString(
              this.inputObject.value
            )
          }
          this.syncDatePickerInput(this.inputObject.inputValue)
          break
        case 'datetimepicker':
          // this.inputObject.value is expected to be a unixTimestamp or null
          this.syncDateTimePickerInput(this.inputObject.value)
          break
        case 'stripe-pi-editable':
          this.tempInput = this.inputObject.inputValue
          break
        case 'type-combobox':
        case 'type-autocomplete':
        case 'type-autocomplete-multiple':
          if (!this.inputObject.inputDefinition.entity) {
            throw new Error(
              `Entity required for combobox, autocomplete-(multiple) input types`
            )
          }
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
