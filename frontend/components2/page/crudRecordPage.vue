<template>
  <div v-if="viewDefinition?.paginationOptions">{{ viewDefinition }}</div>
  <v-container v-else fill-height>
    <v-layout align-center justify-center>
      <div>
        <span class="display-1 pl-2">{{
          viewDefinition ? 'View Not Available' : 'View Not Found'
        }}</span>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  props: {
    viewDefinition: {
      required: true,
    },
  },
}
</script>
