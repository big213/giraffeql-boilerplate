<template>
  <v-img
    :src="previewImageUrl"
    class="white--text align-end"
    gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
    height="200px"
  >
    <template v-slot:placeholder>
      <v-row class="fill-height ma-0" align="center" justify="center">
        <v-icon size="200" color="grey darken-3">{{ recordInfo.icon }}</v-icon>
      </v-row>
    </template>
    <v-card-title class="subheading font-weight-bold pb-2"
      ><span class="break-word">{{ previewName }} </span>
    </v-card-title>
  </v-img>
</template>

<script>
import heroMixin from '~/mixins/hero'

export default {
  mixins: [heroMixin],
}
</script>
