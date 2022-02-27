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
import { executeGiraffeql } from '~/services/giraffeql'

export default {
  props: {
    // the item that is being followed. id, __typename, currentUserFollowLink fields must be populated
    item: {
      type: Object,
      required: true,
    },
    // the name of the follow link model
    followLinkModel: {
      type: String,
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

        const capitalizedLinkModel = capitalizeString(this.followLinkModel)
        if (!this.item.currentUserFollowLink) {
          const data = await executeGiraffeql(this, {
            [`create${capitalizedLinkModel}`]: {
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
          await executeGiraffeql(this, {
            [`delete${capitalizedLinkModel}`]: {
              __args: {
                id: this.item.currentUserFollowLink.id,
              },
            },
          })
          this.item.currentUserFollowLink = null
        }
        this.$notifier.showSnackbar({
          message: `${capitalizeString(this.item.__typename)} ${
            this.item.currentUserFollowLink ? '' : 'Un-'
          }Followed`,
          variant: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.toggleFollow = false
    },
  },
}
</script>
