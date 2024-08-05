<template>
  <div>
    <v-icon small left @click.stop="openEditFieldDialog()">mdi-pencil</v-icon>
    {{ currentValue }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
export default {
  mixins: [columnMixin],
  computed: {},

  methods: {
    openEditFieldDialog() {
      this.$emit('edit-item', this.item, [this.fieldPath])
    },
  },
}
</script>
