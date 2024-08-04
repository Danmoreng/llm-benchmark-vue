<template>
  <v-app>
    <v-layout class="rounded rounded-md">
      <v-app-bar
          class="px-3"
          density="compact"
          title="LLM Playground"
          flat
      >
        <v-tabs
            color="primary"
            centered
        >
          <v-tab
              v-for="item in items"
              :key="item.title"
              :to="item.route"
              :text="item.title"
              router
              link
          ></v-tab>
        </v-tabs>
        <v-spacer></v-spacer>

        <v-avatar
            color="grey-darken-1"
            size="32"
        ></v-avatar>
      </v-app-bar>

      <v-main>
        <RouterView />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const items = ref([
  { title: 'Playground', route: '/' },
  { title: 'Models', route: '/models' }
]);
</script>

<style>
.v-navigation-drawer {
  width: 250px;
}

ul, ol {
  padding-left: 2rem;
}
</style>
