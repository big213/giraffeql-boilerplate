<template>
  <v-menu v-if="item" v-model="open" v-bind="$attrs">
    <!-- pass through scoped slots -->
    <template v-slot:activator="slotData">
      <slot v-if="$scopedSlots.activator" name="activator" v-bind="slotData" />
      <PreviewRecordChip
        v-else
        :value="item"
        small
        v-bind="slotData.attrs"
        v-on="slotData.on"
      ></PreviewRecordChip>
    </template>
    <v-card>
      <div v-if="hasHeroOptions">
        <component
          :is="heroComponent"
          :item="item"
          :hero-options="previewDefinition.heroOptions"
          :entity="previewDefinition.entity"
        ></component>
      </div>
      <v-list v-if="hasLineItems">
        <v-list-item>
          <v-list-item-avatar v-if="!hasHeroOptions">
            <v-img v-if="item.avatar" :src="item.avatar" />
            <v-icon v-else>{{ fallbackIcon }} </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <template>
              <v-list-item-title v-if="!hasHeroOptions">
                <i v-if="item.name === undefined">{{ item.id }}</i>
                <span v-else> {{ item.name }}</span>
              </v-list-item-title>
              <v-progress-linear
                v-if="loading.loadData"
                indeterminate
              ></v-progress-linear>
              <template v-else-if="itemData">
                <v-list-item-subtitle v-for="(field, i) in fields" :key="i"
                  >{{ renderFieldTitle(field) }}:
                  <component
                    v-if="getFieldComponent(field)"
                    :is="getFieldComponent(field)"
                    :item="itemData"
                    :field-path="getFieldPath(field)"
                    style="display: inline"
                  ></component>
                  <span v-else>{{ itemData[field] }}</span>
                </v-list-item-subtitle>
              </template>
            </template>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-card-actions
        v-if="previewDefinition.followOptions && !isViewButtonHidden"
      >
        <FollowButton
          v-if="
            !isFollowButtonHidden && itemData && previewDefinition.followOptions
          "
          color="primary"
          :item="itemData"
          :follow-options="previewDefinition.followOptions"
        ></FollowButton>
        <v-spacer></v-spacer>
        <v-btn v-if="!isViewButtonHidden" color="primary" @click="openPage()">
          <v-icon v-if="openMode === 'openInNew'" left>mdi-open-in-new</v-icon>
          View
        </v-btn>
      </v-card-actions>
      <div v-if="actions.length" class="pa-2">
        <v-btn
          v-for="(action, index) in actions"
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
  enterRoute,
  generateViewRecordRoute,
  processQuery,
  camelCaseToCapitalizedString,
} from '~/services/base'
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
  },

  data() {
    return {
      open: false,
      itemData: null,
      loading: {
        loadData: false,
      },
    }
  },

  computed: {
    fallbackIcon() {
      return this.previewDefinition.entity.icon
    },
    capitalizedType() {
      return capitalizeString(this.typenameComputed)
    },
    typenameComputed() {
      return this.typename ?? this.item.__typename
    },
    // must exist
    previewDefinition() {
      return previews[`${capitalizeString(this.typenameComputed)}Preview`]
    },
    // if previewOptions is not specified, default to showing typename only
    fields() {
      return this.previewDefinition.fields
    },
    actions() {
      return this.previewDefinition?.actions ?? []
    },
    hasHeroOptions() {
      return !!this.previewDefinition?.heroOptions
    },
    hasLineItems() {
      return this.fields.length > 0 || !this.hasHeroOptions
    },
    isViewButtonHidden() {
      return !!this.previewDefinition?.hideViewButton
    },

    isFollowButtonHidden() {
      return !!this.previewDefinition?.hideFollowButton
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

    renderFieldTitle(field) {
      return field === '__typename'
        ? 'Type'
        : this.previewDefinition.renderFields?.[field]?.text ??
            camelCaseToCapitalizedString(field)
    },

    getFieldComponent(field) {
      return this.previewDefinition.renderFields?.[field]?.component
    },

    // pathPrefix, OR fields[0], OR the name of the field
    getFieldPath(field) {
      const fieldInfo = this.previewDefinition.renderFields?.[field]

      if (!fieldInfo) return null

      return (
        fieldInfo.pathPrefix ??
        (fieldInfo.fields && fieldInfo.fields.length > 1 ? null : field)
      )
    },

    openPage() {
      if (this.openMode === 'openInNew') {
        enterRoute(
          this,
          generateViewRecordRoute(this, {
            routeKey: this.typenameComputed,
            routeType: 'i',
            id: this.item.id,
          }),
          true
        )
      } else if (this.openMode === 'openInDialog') {
        this.$root.$emit('openEditRecordDialog', {
          viewDefinition: 'Public' + this.capitalizedType,
          mode: 'view',
          selectedItem: {
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
        const { query } =
          this.previewDefinition &&
          (await processQuery(this, this.previewDefinition, this.fields, true))

        this.itemData = await executeApiRequest({
          [`get${this.capitalizedType}`]: {
            id: true,
            __typename: true,
            ...query,
            ...(this.previewDefinition.followOptions && {
              currentUserFollowLink: {
                id: true,
              },
            }),
            __args: {
              id: this.item.id,
            },
          },
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadData = false
    },

    reset() {
      this.loadData()
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
