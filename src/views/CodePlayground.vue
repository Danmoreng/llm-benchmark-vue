<template>
  <v-container fluid class="playground-container">
    <Editor />
  </v-container>
</template>

<script setup lang="ts">
import Editor from '@/components/Editor.vue';
</script>

<style scoped>
.playground-container {
  height: calc(100vh - 64px); /* Adjust height to exclude the app bar or other elements */
  overflow: hidden; /* Ensure no extra scrolls */
  padding: 0;
}
</style>
