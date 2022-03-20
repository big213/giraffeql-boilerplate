<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text class="py-0 mt-3">
      <v-alert v-if="itemIdentifier" type="info">
        {{ itemIdentifier }}
      </v-alert>
      <v-container>
        <v-row>
          <v-col xs="12" class="py-0">
            <v-text-field
              :value="shareUrl"
              label="Share URL"
              readonly
              append-icon="mdi-content-copy"
              filled
              dense
              class="py-0"
              @focus="$event.target.select()"
              @click:append="copyToClipboard(shareUrl)"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
    </v-card-actions>
  </v-card>
</template>

<script>
import { copyToClipboard, generateViewRecordRoute } from '~/services/base'

export default {
  props: {
    selectedItem: {
      type: Object,
    },
    recordInfo: {
      type: Object,
      required: true,
    },
  },

  computed: {
    shareUrl() {
      return this.selectedItem
        ? window.location.origin +
            generateViewRecordRoute(this, {
              typename: this.recordInfo.typename,
              routeType: 'i',
              id: this.selectedItem.id,
            })
        : ''
    },
    itemIdentifier() {
      return this.recordInfo.renderItem && this.selectedItem
        ? this.recordInfo.renderItem(this.selectedItem)
        : null
    },
  },

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
