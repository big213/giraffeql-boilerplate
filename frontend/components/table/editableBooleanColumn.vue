<template>
  <div>
    <v-menu offset-x right>
      <template v-slot:activator="{ on, attrs }">
        <v-chip
          small
          :color="currentBooleanOption.color"
          text-color="white"
          v-bind="attrs"
          v-on="on"
        >
          {{ currentBooleanOption.text }}
        </v-chip>
      </template>
      <v-list dense>
        <v-list-item
          v-for="(item, index) in booleanOptions"
          :key="index"
          :class="{ 'selected-bg': currentValue === item.value }"
          @click="updateBooleanField(item.value)"
        >
          <v-chip
            small
            :color="item.color"
            text-color="white"
            class="pointer-cursor"
          >
            {{ item.text }}
          </v-chip>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-progress-circular
      v-if="loading.submit"
      indeterminate
      size="16"
    ></v-progress-circular>
  </div>
</template>

<script>
import { executeApiRequest } from '~/services/api'
import { handleError } from '~/services/base'
import columnMixin from '~/mixins/column'
import { capitalizeString } from '~/services/base'

export default {
  mixins: [columnMixin],

  data() {
    return {
      booleanOptions: [
        {
          value: true,
          text: 'Yes',
          color: 'green',
        },
        {
          value: false,
          text: 'No',
          color: 'red',
        },
        {
          value: null,
          text: 'Unknown',
          color: null,
        },
      ],
      loading: {
        submit: false,
      },
    }
  },

  computed: {
    currentBooleanOption() {
      return (
        this.booleanOptions.find((ele) => ele.value === this.currentValue) ??
        null
      )
    },
  },

  methods: {
    async updateBooleanField(value) {
      this.loading.submit = true
      try {
        await executeApiRequest({
          [`${this.item.__typename}Update`]: {
            __args: {
              fields: {
                [this.renderFieldDefinition.fieldKey]: value,
              },
              item: {
                id: this.item.id,
              },
            },
          },
        })

        this.$root.$emit('refresh-interface', this.item.__typename)

        this.$root.$emit('showSnackbar', {
          message: `${capitalizeString(this.item.__typename)} updated`,
          color: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submit = false
    },
  },
}
</script>
<style>
.selected-bg {
  background-color: var(--v-primary-base);
}

.pointer-cursor {
  cursor: pointer;
}
</style>
