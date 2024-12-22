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
    viewDefinition: {
      type: Object,
      required: true,
    },
  },

  computed: {
    shareUrl() {
      return this.viewDefinition.shareOptions.getUrl
        ? this.viewDefinition.shareOptions.getUrl(
            this,
            this.viewDefinition,
            this.selectedItem.id
          )
        : generateShareUrl(this, {
            routeKey: this.viewDefinition.entity.typename,
            id: this.selectedItem.id,
            showComments: true,
          })
    },
    // default to name || id
    itemIdentifier() {
      return this.viewDefinition.entity.nameField
        ? this.selectedItem[this.viewDefinition.entity.nameField]
        : this.selectedItem.id
    },
  },

  methods: {
    copyToClipboard(content) {
      copyToClipboard(this, content)
    },
  },
}
</script>
