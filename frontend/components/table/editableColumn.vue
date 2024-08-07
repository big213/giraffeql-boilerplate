<template>
  <div>
    <v-icon v-if="isLeftSide" small left @click.stop="openEditFieldDialog()"
      >mdi-pencil</v-icon
    >
    {{ currentValue }}
    <v-icon v-if="!isLeftSide" small right @click.stop="openEditFieldDialog()"
      >mdi-pencil</v-icon
    >
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
export default {
  mixins: [columnMixin],
  computed: {
    // expected options: leftSide?: boolean

    isLeftSide() {
      return this.options?.leftSide
    },
  },

  methods: {
    openEditFieldDialog() {
      this.$emit('edit-item', this.item, [this.fieldPath])
    },
  },
}
</script>
