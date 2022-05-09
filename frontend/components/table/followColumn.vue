<template>
  <div>
    <FollowButton
      color="primary"
      small
      :follow-link-model="followLinkModel"
      :item="item"
    ></FollowButton>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import FollowButton from '~/components/button/followButton.vue'
import { capitalizeString } from '~/services/base'
import * as simpleModels from '~/models/simple'

export default {
  components: {
    FollowButton,
  },

  mixins: [columnMixin],

  computed: {
    recordInfo() {
      return simpleModels[`Simple${capitalizeString(this.item.__typename)}`]
    },
    followLinkModel() {
      return this.recordInfo?.followLinkModel
    },
  },
}
</script>
