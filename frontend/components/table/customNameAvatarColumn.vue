<template>
  <NameAvatarColumn v-bind="_props">
    <template v-slot:components>
      <v-icon class="ml-2" small>mdi-comment</v-icon>
      <v-chip color="orange" small class="black--text ml-2">Some Chip</v-chip>
    </template>
  </NameAvatarColumn>
</template>

<script>
import columnMixin from '~/mixins/column'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'

export default {
  components: { NameAvatarColumn },
  mixins: [columnMixin],
}
</script>
