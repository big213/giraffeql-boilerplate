<template>
  <v-layout column justify-center align-center fill-height>
    <v-container xs12 style="max-width: 600px">
      <v-col>
        <v-card class="elevation-12">
          <v-toolbar color="accent" flat dense>
            <v-icon left>mdi-account-key</v-icon>
            <v-toolbar-title>Login Credentials</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <UpdateCredentialsInterface></UpdateCredentialsInterface>
        </v-card>
      </v-col>
      <v-col>
        <v-card class="elevation-12">
          <EditRecordInterface
            :selected-item="selectedItem"
            :record-info="recordInfo"
            mode="edit"
            :generation="generation"
            @handle-submit="reset()"
          >
            <template v-slot:toolbar>
              <v-toolbar flat color="accent" dense>
                <v-icon left>{{ recordInfo.icon }}</v-icon>
                <v-toolbar-title> {{ recordInfo.title }} </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="reset()">
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </v-toolbar>
            </template>
          </EditRecordInterface>
        </v-card>
      </v-col>
    </v-container>
  </v-layout>
</template>

<script>
import UpdateCredentialsInterface from '~/components/interface/auth/updateCredentialsInterface.vue'
import EditRecordInterface from '~/components/interface/crud/editRecordInterface.vue'
import { MySettings } from '~/models'

export default {
  middleware: ['router-auth'],
  components: {
    UpdateCredentialsInterface,
    EditRecordInterface,
  },

  data() {
    return {
      recordInfo: MySettings,
      generation: 0,
    }
  },

  computed: {
    selectedItem() {
      return {
        id: this.$store.getters['auth/user'].id,
      }
    },
  },

  methods: {
    reset() {
      this.generation++
    },
  },

  head() {
    return {
      title: 'My Settings',
    }
  },
}
</script>
