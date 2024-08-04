<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-card>
      <v-card-title class="headline">Create New Chat</v-card-title>
      <v-card-text>
        <v-textarea
            label="System Prompt"
            v-model="settings.systemPrompt"
            variant="outlined"
            density="compact"
        ></v-textarea>
        <v-row>
          <v-col cols="6">
            <v-select
                v-model="settings.model"
                :items="modelStore.models"
                item-title="model"
                item-value="model"
                label="Select Model"
                variant="outlined"
                density="compact"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>
                    {{ item.raw.details.parameter_size }} |
                    {{ (item.raw.size / (1024 * 1024 * 1024)).toFixed(2) }} GB
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="4">
            <v-slider
                v-model="settings.temperature"
                label="Temperature"
                min="0"
                max="1"
                step="0.01"
                thumb-label
            ></v-slider>
          </v-col>
          <v-col cols="2">
            <v-text-field variant="outlined" v-model="settings.temperature" density="compact" type="number" step="0.01" min="0"
                          max="1"></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
        <v-btn color="blue darken-1" text @click="createChat">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import { useModelStore } from '@/stores/models';
import { useChatStore } from "@/stores/chats";
import type {ChatSettings} from "@/types/generic";

const dialog = ref(false);

const settings = ref<ChatSettings>({
  temperature: 0.7,
  model: '',
  systemPrompt: 'You are a helpful chatbot. For testing purposes keep your answer very brief and concise. It must not be longer than three sentences.',
})

const modelStore = useModelStore();
const chatsStore = useChatStore();

const createChat = () => {
  if (settings.value.model && settings.value.systemPrompt) {
    chatsStore.createChat(Object.assign({}, settings.value));
    close();
  }
};

const close = () => {
  dialog.value = false;
};

const open = () => {
  dialog.value = true;
};

modelStore.fetchModels();

defineExpose({ dialog, open });
</script>
