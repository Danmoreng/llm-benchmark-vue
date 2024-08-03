<template>
  <main>
    <v-container>
      <v-row>
        <v-col>
          <v-textarea
              label="System Prompt"
              v-model="systemPrompt"
              variant="outlined"
              density="compact"
          ></v-textarea>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <v-select
              v-model="modelStore.selectedModel"
              :items="modelStore.models"
              item-title="model"
              return-object
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
              v-model="temperature"
              label="Temperature"
              min="0"
              max="1"
              step="0.01"
              thumb-label
          ></v-slider>
        </v-col>
        <v-col cols="2">
          <v-text-field variant="outlined" v-model="temperature" density="compact" type="number" step="0.01" min="0"
                        max="1"></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-if="chatId !== ''">
          <Chat :chatId="chatId" />
        </v-col>
        <v-col v-for="chat in chatsStore.conversations" >
          <Chat :chatId="chat.id" />
        </v-col>
      </v-row>
      <v-row class="mt-3">
        <v-col cols="10">
          <v-textarea
              label="User Input"
              v-model="userMessage"
              variant="outlined"
              density="compact"
          ></v-textarea>
        </v-col>
        <v-col cols="2">
          <v-btn variant="flat" color="primary" @click="sendChat">Send</v-btn>
        </v-col>
      </v-row>
    </v-container>
  </main>
</template>

<script setup lang="ts">
import Chat from "@/components/chat.vue";
import {useModelStore} from '@/stores/models';
import {useChatStore} from "@/stores/chats";

const modelStore = useModelStore();
const chatsStore = useChatStore();
const chatId = ref("");
import {onMounted, ref} from "vue";
onMounted(() => {
  modelStore.fetchModels();
});

const systemPrompt = ref("You are a helpful chatbot. For testing purposes keep your answer very brief and concise. It must not be longer than three sentences.");
const userMessage = ref("Why is the sky blue?");
const temperature = ref(0.7);
async function sendChat() {
  console.log('clicked');
  console.log(chatsStore.conversations);
  if(chatId.value === ""){
    console.log('create chat');
    chatId.value = chatsStore.createConversation(modelStore.selectedModel?.model, systemPrompt.value);
    console.log('chat id: ', chatId.value);
  }
  console.log('generating response');
  await chatsStore.sendMessage(chatId.value, userMessage.value);
}
</script>