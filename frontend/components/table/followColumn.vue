<template>
  <div>
    <FollowButton
      v-if="followOptions"
      color="primary"
      small
      :follow-options="followOptions"
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
    followOptions() {
      return this.options?.followOptions
    },
  },
}
</script>
