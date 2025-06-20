<template>
  <v-btn
    v-bind="$attrs"
    :loading="loading.toggleFollow"
    @click="toggleFollow()"
    >{{ item.currentUserFollowLink ? 'Following' : 'Follow' }}</v-btn
  >
</template>

<script>
import { handleError, capitalizeString } from '~/services/base'
import { executeApiRequest } from '~/services/api'

export default {
  props: {
    // the item that is being followed. id, __typename, currentUserFollowLink fields must be populated
    item: {
      type: Object,
      required: true,
    },
    // the Follow Options
    followOptions: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      loading: {
        toggleFollow: false,
      },
    }
  },

  methods: {
    async toggleFollow() {
      this.loading.toggleFollow = true
      try {
        // login is required
        if (!this.$store.getters['auth/user']) throw new Error('Login required')

        if (!this.item.currentUserFollowLink) {
          const data = await executeApiRequest({
            [`${this.followOptions.entity.typename}Create`]: {
              id: true,
              __args: {
                user: {
                  id: this.$store.getters['auth/user']?.id,
                },
                target: {
                  id: this.item.id,
                },
              },
            },
          })
          this.item.currentUserFollowLink = data
        } else {
          await executeApiRequest({
            [`${this.followOptions.entity.typename}Delete`]: {
              __args: {
                id: this.item.currentUserFollowLink.id,
              },
            },
          })
          this.item.currentUserFollowLink = null
        }

        this.$root.$emit('showSnackbar', {
          message: `${capitalizeString(this.item.__typename)} ${
            this.item.currentUserFollowLink ? '' : 'Un-'
          }Followed`,
          color: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.toggleFollow = false
    },
  },
}
</script>
