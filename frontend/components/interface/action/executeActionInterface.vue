<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'dialog-max-height': dialogMode }" class="pt-3">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <div v-show="!isLoading">
        <div
          v-if="actionDefinition.previewOptions"
          class="selected-element mb-5"
        >
          <ViewRecordInterface
            :parent-item="parentItem"
            :view-definition="actionDefinition.previewOptions.viewDefinition"
            :override-options="actionDefinition.previewOptions.viewOptions"
            mode="view"
            :generation="previewGeneration"
          >
          </ViewRecordInterface>
          <v-divider></v-divider>
        </div>
        <v-container v-show="visibleInputsArray.length" class="px-0">
          <v-row v-if="actionDefinition.instructionOptions">
            <v-col>
              <component
                v-if="actionDefinition.instructionOptions.component"
                :is="actionDefinition.instructionOptions.component"
              ></component>
              <v-alert v-else type="info">
                {{ actionDefinition.instructionOptions.text }}
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
              ></GenericInput>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-card-text>

    <v-card-actions v-if="!isLoading && !hideActions">
      <v-btn
        v-for="(secondaryActionDefinition, i) in visibleSecondaryActions"
        :key="i"
        color="secondary"
        :loading="loading.executeAction"
        @click="handleSecondaryActionSubmit(secondaryActionDefinition)"
      >
        <v-icon v-if="secondaryActionDefinition.icon" left>{{
          secondaryActionDefinition.icon
        }}</v-icon>
        {{ secondaryActionDefinition.title }}</v-btn
      >
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        ref="submit"
        color="primary"
        :loading="loading.executeAction"
        @click="handleSubmit()"
      >
        <v-icon v-if="actionDefinition.submitButtonIcon" left>{{
          actionDefinition.submitButtonIcon
        }}</v-icon>
        {{ actionDefinition.submitButtonText ?? 'Submit' }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import executeActionInterfaceMixin from '~/mixins/executeActionInterface'

export default {
  mixins: [executeActionInterfaceMixin],
}
</script>
