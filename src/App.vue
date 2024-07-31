<template>
  <v-app>
    <v-layout class="rounded rounded-md">
      <v-app-bar elevation="0" border>
        <v-toolbar-title>Application bar</v-toolbar-title>
      </v-app-bar>

      <v-navigation-drawer app>
        <v-list>
          <v-list-item
            v-for="item in items"
            :key="item.title"
            :to="item.route"
            router
            link
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <RouterView />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const items = ref([
  { title: 'Home', route: '/' },
  { title: 'About', route: '/about' }
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
