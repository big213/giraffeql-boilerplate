<template>
  <div>
    <span v-if="item.ratingCount < 1">N/A</span>
    <div v-else>
      <v-rating
        v-model="item.ratingAverage"
        :title="`${item.ratingAverage.toFixed(1)}/5 Stars`"
        length="5"
        color="yellow darken-2"
        background-color="grey lighten-1"
        class="d-inline-block"
        small
        dense
        half-increments
        readonly
      ></v-rating>
      <span>({{ item.ratingCount }})</span>
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],
}
</script>
