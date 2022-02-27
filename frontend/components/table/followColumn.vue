<template>
  <div v-if="user">
    <FollowButton
      color="primary"
      small
      :follow-link-model="followLinkModel"
      :item="item"
    ></FollowButton>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import columnMixin from '~/mixins/column'
import FollowButton from '~/components/button/followButton.vue'

export default {
  components: {
    FollowButton,
  },

  mixins: [columnMixin],

  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    followLinkModel() {
      return this.options?.linkModel
    },
  },
}
</script>
