<template>
  <div>
    <span v-if="!currentValue">N/A</span>
    <div v-else>
      <v-rating
        v-model="currentValue"
        :title="`${currentValue}/5 Stars`"
        length="5"
        color="yellow darken-2"
        background-color="grey lighten-1"
        class="d-inline-block"
        small
        dense
        half-increments
        readonly
      ></v-rating>
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],
}
</script>
