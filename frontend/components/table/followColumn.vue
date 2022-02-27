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

export default {
  components: {
    FollowButton,
  },

  mixins: [columnMixin],

  computed: {
    followLinkModel() {
      return this.options?.linkModel
    },
  },
}
</script>
