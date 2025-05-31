<template>
  <v-menu
    v-if="item"
    v-model="open"
    v-bind="$attrs"
    :disabled="!previewDefinition"
  >
    <!-- pass through scoped slots -->
    <template v-slot:activator="slotData">
      <slot v-if="$scopedSlots.activator" name="activator" v-bind="slotData" />
      <PreviewRecordChip
        v-else
        :value="item"
        small
        v-bind="slotData.attrs"
        v-on="slotData.on"
        :style="chipMaxWidth ? `maxWidth: ${chipMaxWidth}` : null"
      ></PreviewRecordChip>
    </template>
    <v-card v-if="previewDefinition">
      <div v-if="previewDefinition.heroOptions">
        <component
          :is="heroComponent"
          :item="item"
          :hero-options="previewDefinition.heroOptions"
          :entity="previewDefinition.entity"
        ></component>
      </div>
      <v-list v-if="fields.length > 0 || !previewDefinition.heroOptions">
        <v-list-item>
          <v-list-item-avatar v-if="!previewDefinition.heroOptions">
            <v-img v-if="item.avatar" :src="item.avatar" />
            <v-icon v-else>{{ previewDefinition.entity.icon }} </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <template>
              <v-list-item-title v-if="!previewDefinition.heroOptions">
                <i v-if="item.name === undefined">{{ item.id }}</i>
                <span v-else> {{ item.name }}</span>
              </v-list-item-title>
              <v-progress-linear
                v-if="loading.loadData"
                indeterminate
              ></v-progress-linear>
              <template v-else-if="itemData">
                <v-list-item-subtitle
                  v-for="(previewObject, i) in renderFieldsArray"
                  :key="i"
                  >{{ previewObject.text }}:
                  <component
                    v-if="previewObject.renderDefinition.component"
                    :is="previewObject.renderDefinition.component"
                    :item="itemData"
                    :render-field-definition="previewObject"
                    display-mode="preview"
                    style="display: inline"
                  ></component>
                  <span v-else>{{ previewObject.value }}</span>
                </v-list-item-subtitle>
              </template>
            </template>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-card-actions
        v-if="
          previewDefinition.followOptions && !previewDefinition.hideViewButton
        "
      >
        <FollowButton
          v-if="
            !previewDefinition.hideFollowButton &&
            itemData &&
            previewDefinition.followOptions
          "
          color="primary"
          :item="itemData"
          :follow-options="previewDefinition.followOptions"
        ></FollowButton>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!previewDefinition.hideViewButton"
          color="primary"
          @click="openPage()"
        >
          <v-icon v-if="openMode === 'openInNew'" left>mdi-open-in-new</v-icon>
          View
        </v-btn>
      </v-card-actions>
      <div v-if="previewDefinition.actions?.length" class="pa-2">
        <v-btn
          v-for="(action, index) in previewDefinition.actions"
          :key="index"
          block
          color="primary"
          :class="index > 0 ? 'mt-1' : null"
          @click.stop="handleCustomActionClick(action)"
          ><v-icon v-if="action.icon" left>{{ action.icon }}</v-icon
          >{{ action.text }}</v-btn
        >
      </div>
    </v-card>
  </v-menu>
  <v-chip v-else small>
    <v-avatar left>
      <v-icon small>mdi-help</v-icon>
    </v-avatar>
    <i>(Not Found)</i></v-chip
  >
</template>

<script>
import {
  handleError,
  capitalizeString,
  processRenderQuery,
  camelCaseToCapitalizedString,
  enterRoute,
  getNestedProperty,
} from '~/services/base'
import { generateViewRecordRoute } from '~/services/route'
import { executeApiRequest } from '~/services/api'
import FollowButton from '~/components/button/followButton.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'
import * as previews from '~/models/previews'
import Hero from '~/components/interface/crud/hero/hero.vue'

export default {
  components: {
    FollowButton,
    PreviewRecordChip,
  },
  props: {
    // avatar/name optional
    item: {
      type: Object,
      required: true,
    },

    // only required if it is not provided *in* item as __typename
    typename: {
      type: String,
    },

    openMode: {
      type: String,
      default: 'openInNew',
      validator: (value) => {
        return ['emit', 'openInNew', 'openInDialog'].includes(value)
      },
    },

    chipMaxWidth: {},
  },

  data() {
    return {
      open: false,
      itemData: null,
      renderFieldsArray: [],
      loading: {
        loadData: false,
      },
    }
  },

  computed: {
    typenameComputed() {
      return this.typename ?? this.item.__typename
    },
    // if not exists, the preview will be disabled
    previewDefinition() {
      return previews[`${capitalizeString(this.typenameComputed)}Preview`]
    },
    // if previewOptions is not specified, default to showing typename only
    fields() {
      return this.previewDefinition?.fields
    },

    heroComponent() {
      return this.previewDefinition?.heroOptions?.component ?? Hero
    },
  },

  watch: {
    open() {
      if (!this.open) return
      this.reset()
    },
  },

  methods: {
    handleCustomActionClick(action) {
      action.handleClick(this, this.item)
    },

    openPage() {
      if (this.openMode === 'openInNew') {
        enterRoute(
          this,
          generateViewRecordRoute(this, {
            routeObject: {
              routeType: 'public',
              routeKey: this.typenameComputed,
            },
            id: this.item.id,
          }),
          true
        )
      } else if (this.openMode === 'openInDialog') {
        this.$root.$emit('openEditRecordDialog', {
          viewDefinition: `Public${capitalizeString(
            this.typenameComputed
          )}View`,
          mode: 'view',
          parentItem: {
            id: this.item.id,
          },
        })
      } else {
        // emit
        // this.$emit()
      }
    },

    async loadData() {
      this.loading.loadData = true
      try {
        const renderFieldDefinitions = this.previewDefinition.fields

        const query = await processRenderQuery(this, {
          renderFieldDefinitions,
        })

        const data = await executeApiRequest({
          [`${this.typenameComputed}Get`]: {
            ...query,
            ...(this.previewDefinition?.followOptions && {
              currentUserFollowLink: {
                id: true,
              },
            }),
            __args: {
              id: this.item.id,
            },
          },
        })

        this.itemData = data

        // load the renderFieldsArray
        this.renderFieldsArray = await Promise.all(
          renderFieldDefinitions.map((renderFieldDefinition) => {
            const previewObject = {
              fieldKey: renderFieldDefinition.fieldKey,
              text:
                renderFieldDefinition.renderDefinition.text ??
                camelCaseToCapitalizedString(renderFieldDefinition.fieldKey),
              renderDefinition: renderFieldDefinition.renderDefinition,
              value: getNestedProperty(data, renderFieldDefinition.fieldKey),
              readonly: true,
              generation: 0,
              verticalMode: renderFieldDefinition.verticalMode ?? false,
              hideIf: renderFieldDefinition.hideIf,
            }

            return previewObject
          })
        )
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadData = false
    },

    reset() {
      if (this.previewDefinition) {
        this.loadData()
      }
    },
  },
}
</script>
<style scoped>
.v-chip--pill .v-avatar {
  height: 24px !important;
  width: 24px !important;
}
</style>
