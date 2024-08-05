<template>
  <v-card variant="flat" class="chat">
    <v-card-title>
      <v-row>
        <v-col cols="4" style="overflow: hidden">
          {{ chatsStore.chats[chatId].settings.model }}
        </v-col>
        <v-col cols="8" class="d-flex justify-end align-center">
          <v-btn density="compact" variant="text" color="info" @click="editMode = !editMode">Edit</v-btn>
          <v-btn density="compact" variant="text" color="warning" @click="chatsStore.resetChat(chatId)">Reset</v-btn>
          <v-btn density="compact" variant="text" color="error" @click="chatsStore.deleteChat(chatId)">Delete</v-btn>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-subtitle>
      Temperature: {{chat.settings.temperature}} | {{ chatsStore.getInferenceTokensPerSecond(chatId) }} T/s
    </v-card-subtitle>
    <v-card-text>
      <v-row>
        <v-col v-if="chatId !== ''" style="max-width: 900px">
          <ChatMessage
            v-for="(message, index) in chatsStore.chats[chatId].messages"
            :key="index"
            :message="message"
            :editMode="editMode"
            :index="index"
            :chatId="chatId"
            @deleteMessage="deleteMessage"
          />
          <v-btn density="compact" variant="tonal" color="primary" @click="addMessage">Add Message</v-btn>
        </v-col>
        <v-col v-if="false">
          <v-table density="compact">
            <thead>
            <tr>
              <th colspan="2">Response Statistics</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>Evaluation Duration</td>
              <td>{{ (chatsStore.chats[chatId].statistics.eval_duration / 1e9).toFixed(3) }} seconds</td>
            </tr>
            <tr>
              <td>Load Duration</td>
              <td>{{ (chatsStore.chats[chatId].statistics.load_duration / 1e9).toFixed(3) }} seconds</td>
            </tr>
            <tr>
              <td>Prompt Evaluation Duration</td>
              <td>{{ (chatsStore.chats[chatId].statistics.prompt_eval_duration / 1e9).toFixed(3) }} seconds</td>
            </tr>
            <tr>
              <td>Prompt Tokens per Second</td>
              <td>{{ chatsStore.getPromptTokensPerSecond(chatId) }} T/s</td>
            </tr>
            <tr>
              <td>Total Duration</td>
              <td>{{ (chatsStore.chats[chatId].statistics.total_duration / 1e9).toFixed(3) }} seconds</td>
            </tr>
            <tr>
              <td>Inference Tokens per Second</td>
              <td>{{ chatsStore.getInferenceTokensPerSecond(chatId) }} T/s</td>
            </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useChatStore} from "@/stores/chats";
import ChatMessage from './ChatMessage.vue'; // Make sure the path is correct

const chatsStore = useChatStore();
const editMode = ref(false);
const props = defineProps<{
  chatId: string
}>();
const chat = computed(() => {
  return chatsStore.chats[props.chatId];
});

function deleteMessage(index: number) {
  chatsStore.deleteMessage(props.chatId, index);
}

function addMessage() {
  chatsStore.addMessage(props.chatId);
}
</script>

<style>
.chat {
  min-width: 500px;
  max-width: 900px;
}
pre {
  background: #3e3e3e;
  padding: 1rem;
  border-radius: 4px;
  margin: 10px 0 20px 0;
}

code {
  font-family: 'Courier New', Courier, monospace;
}

.role-system {
  background: #ba7100;
}

.role-assistant {
  background: #35002d;
  margin-right: 50px;
}

.role-user {
  background: #303030;
  margin-left: 50px;
}
</style>