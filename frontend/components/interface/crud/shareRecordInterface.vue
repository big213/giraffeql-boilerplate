<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text class="py-0 mt-3">
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
import { copyToClipboard, generateShareUrl } from '~/services/base'

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
  },

  computed: {
    shareUrl() {
      return this.recordInfo.shareOptions.getUrl
        ? this.recordInfo.shareOptions.getUrl(
            this,
            this.recordInfo,
            this.selectedItem.id
          )
        : generateShareUrl(this, {
            routeKey: this.recordInfo.typename,
            id: this.selectedItem.id,
            showComments: true,
          })
    },
    // default to name || id
    itemIdentifier() {
      return this.recordInfo.renderItem
        ? this.recordInfo.renderItem(this.selectedItem)
        : this.selectedItem.name || this.selectedItem.id
    },
  },

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
