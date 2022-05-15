<template>
  <v-chip pill v-bind="$attrs">
    <v-avatar left>
      <v-img v-if="avatar" :src="avatar" contain></v-img
      ><v-icon v-else>{{ fallbackIcon }} </v-icon>
    </v-avatar>
    {{ name }}
    <slot name="rightIcon" />
  </v-chip>
</template>
<script>
import * as simpleModels from '~/models/simple'
import { capitalizeString } from '~/services/base'

export default {
  props: {
    // __typename is required
    item: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {}
  },

  computed: {
    recordInfo() {
      return simpleModels[`Simple${capitalizeString(this.item.__typename)}`]
    },

    name() {
      return this.recordInfo?.chipOptions?.getName
        ? this.recordInfo.chipOptions.getName(this.item)
        : this.item.name
    },

    avatar() {
      return this.recordInfo?.chipOptions?.getImage
        ? this.recordInfo.chipOptions.getImage(this.item)
        : this.item.avatar
    },

    fallbackIcon() {
      return this.recordInfo?.icon
    },
  },
}
</script>
