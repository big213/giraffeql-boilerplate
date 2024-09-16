<template>
  <v-chip pill v-bind="$attrs" v-on="$listeners">
    <v-avatar left>
      <v-img v-if="avatarUrl" :src="avatarUrl" contain></v-img
      ><v-icon v-else>{{ fallbackIcon }} </v-icon>
    </v-avatar>
    <span v-if="name">
      {{ name }}
    </span>
    <i v-else-if="value.name === undefined">{{ value.id }}</i>
    <i v-else> (Untitled) </i>
    <slot name="rightIcon" />
  </v-chip>
</template>
<script>
import * as simpleModels from '~/models/simple'
import { capitalizeString } from '~/services/base'

export default {
  props: {
    // __typename, id is required. avatar/name optional
    value: {
      type: Object,
      required: true,
    },
  },

  computed: {
    recordInfo() {
      return simpleModels[`Simple${capitalizeString(this.value.__typename)}`]
    },

    name() {
      return this.recordInfo?.chipOptions?.getName
        ? this.recordInfo.chipOptions.getName(this.value)
        : this.value.name
    },

    avatarUrl() {
      return this.recordInfo?.chipOptions?.getImage
        ? this.recordInfo.chipOptions.getImage(this.value)
        : this.value.avatarUrl
    },

    fallbackIcon() {
      return this.recordInfo?.icon
    },
  },
}
</script>
