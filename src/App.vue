<template>
  <v-app :theme="currentTheme">
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

        <v-btn icon @click="toggleTheme">
          <v-icon>{{ currentTheme === 'lightTheme' ? 'mdi-moon-waning-crescent' : 'mdi-white-balance-sunny' }}</v-icon>
        </v-btn>
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
  { title: 'Code Playground', route: '/code' },
  { title: 'Models', route: '/models' }
]);


const currentTheme = ref('lightTheme');
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'lightTheme' ? 'darkTheme' : 'lightTheme';
};
</script>

<style>
.v-theme--lightTheme {
  --pre-background: #d8e2dc;
  --role-system-background: #ffdd93;
  --role-assistant-background: #eeffe7;
  --role-user-background: #d9e8ff;
}

.v-theme--darkTheme {
  --pre-background: #3e3e3e;
  --role-system-background: #494234;
  --role-assistant-background: #282e27;
  --role-user-background: #222831;
}
.v-navigation-drawer {
  width: 250px;
}

ul, ol {
  padding-left: 2rem;
}
</style>
