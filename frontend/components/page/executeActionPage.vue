<template>
  <v-container v-if="loading.loadRecord" fill-height>
    <v-layout align-center justify-center>
      <div v-if="loading.loadRecord">
        <span class="display-1 pl-2"
          >Loading...
          <v-progress-circular indeterminate></v-progress-circular>
        </span>
      </div>
      <div v-else>
        <span class="display-1 pl-2"
          >Action: '{{ actionDefinition.title }}' Not Found</span
        >
      </div>
    </v-layout>
  </v-container>
  <v-container v-else fill-height>
    <v-layout justify-center align-center>
      <v-row>
        <v-col cols="12" md="6" class="text-center" offset-md="3">
          <v-card class="elevation-12">
            <component
              :is="interfaceComponent"
              :action-definition="actionDefinition"
              :item="item"
              :locked-fields="lockedFields"
              dialog-mode
              :generation="generation"
              @handle-submit="handleSubmit()"
              @handle-parent-item-updated="handleItemUpdate"
            >
              <template v-slot:toolbar>
                <v-toolbar flat color="accent">
                  <v-icon left>{{ actionDefinition.icon }}</v-icon>
                  <v-toolbar-title>
                    <span class="headline">{{ actionDefinition.title }}</span>
                  </v-toolbar-title>
                </v-toolbar>
              </template>
            </component>
          </v-card>
        </v-col>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
import ExecuteActionInterface from '~/components/interface/action/executeActionInterface.vue'
import { redirectToLogin } from '~/services/base'

export default {
  data() {
    return {
      loading: {
        loadRecord: false,
      },

      generation: 0,

      item: null,
      lockedFields: null,
    }
  },

  props: {
    // type: ActionDefinition
    actionDefinition: {
      type: Object,
      required: true,
    },
  },

  computed: {
    interfaceComponent() {
      return this.actionDefinition.component ?? ExecuteActionInterface
    },
  },

  created() {
    // if isLoginRequired and not logged in, redirect to login while saving the current path
    if (
      this.actionDefinition.isLoginRequired &&
      !this.$store.getters['auth/user']
    ) {
      redirectToLogin(this, this.$route.path)
    }
  },

  methods: {
    handleSubmit() {
      this.generation++
    },

    handleItemUpdate(item, lockedFields) {
      this.item = item
      this.lockedFields = lockedFields
      this.generation++
    },
  },

  head() {
    return {
      title: `${this.actionDefinition.title}`,
    }
  },
}
</script>
