<template>
  <v-chip v-if="entity" pill v-bind="$attrs" v-on="$listeners" :title="name">
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
import * as entities from '~/models2/entities'
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
    entity() {
      // if no __typename, return null
      if (!this.value.__typename) return null

      return entities[`${capitalizeString(this.value.__typename)}Entity`]
    },

    name() {
      return this.entity ? this.value[this.entity.nameField] : null
    },

    avatarUrl() {
      return this.entity ? this.value[this.entity.avatarField] : null
    },

    fallbackIcon() {
      return this.entity?.icon
    },
  },
}
</script>
