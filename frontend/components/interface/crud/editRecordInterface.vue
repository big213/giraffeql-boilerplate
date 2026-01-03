<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text
      :class="{ 'dialog-max-height': dialogMode && !fullscreenMode }"
      class="pt-3"
    >
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <v-container v-show="!isLoading" class="px-0" fluid>
        <v-row v-if="options?.instructionOptions">
          <v-col>
            <component
              v-if="options.instructionOptions.component"
              :is="options.instructionOptions.component"
            ></component>
            <v-alert v-else type="info">
              {{ options.instructionOptions.text }}
            </v-alert>
          </v-col>
        </v-row>
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
              @file-added="handleFileAdded"
            ></GenericInput>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions v-if="!isLoading">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        v-if="mode !== 'view'"
        ref="submit"
        color="primary"
        :loading="loading.editRecord"
        @click="handleSubmit()"
      >
        <slot name="submit-button">Submit</slot>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import editRecordInterfaceMixin from '~/mixins/editRecordInterface'

export default {
  mixins: [editRecordInterfaceMixin],
}
</script>
