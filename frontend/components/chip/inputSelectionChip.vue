<template>
  <MappedChip
    v-if="inputObject.inputDefinition.selectionValuesMap"
    :value="item"
    :values-map="inputObject.inputDefinition.selectionValuesMap"
  >
  </MappedChip>

  <component
    v-else-if="inputObject.inputDefinition.selectionComponent"
    :is="inputObject.inputDefinition.selectionComponent"
    :value="item"
  >
  </component>
  <v-chip v-else-if="avatarUrl || name || fallbackIcon" pill>
    <v-avatar left>
      <v-img v-if="avatarUrl" :src="avatarUrl"></v-img
      ><v-icon v-else>{{ fallbackIcon }} </v-icon>
    </v-avatar>
    {{ name }}
  </v-chip>
  <v-chip v-else-if="typeof item === 'string'" pill>
    {{ item }}
  </v-chip>
  <v-chip v-else-if="item && typeof item === 'object'" pill>
    {{ item.name }}
  </v-chip>
</template>

<script>
import { getIcon } from '~/services/entity'
import MappedChip from '~/components/chip/mappedChip.vue'

export default {
  components: {
    MappedChip,
  },

  props: {
    inputObject: {
      type: Object,
      required: true,
    },
    item: {
      // could be object or string
      required: true,
    },
  },

  computed: {
    avatarUrl() {
      return this.inputObject.inputDefinition.entity?.avatarField
        ? this.item[this.inputObject.inputDefinition.entity.avatarField]
        : null
    },
    fallbackIcon() {
      return this.inputObject.inputDefinition.entity
        ? getIcon(this.inputObject.inputDefinition.entity.typename)
        : null
    },
    name() {
      return this.inputObject.inputDefinition.entity?.nameField
        ? this.item[this.inputObject.inputDefinition.entity.nameField]
        : null
    },
  },
}
</script>
