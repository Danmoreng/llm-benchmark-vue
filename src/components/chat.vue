<template>
  <v-card variant="flat" max-width="500">
    <v-card-title>
      <v-row>
        <v-col cols="4" style="overflow: hidden">
          {{ chatsStore.chats[chatId].settings.model }}
        </v-col>
        <v-col cols="8" class="d-flex align-content-center justify-space-between">
          <v-btn density="compact" variant="tonal" color="info" @click="editMode = !editMode">Edit</v-btn>
          <v-btn density="compact" variant="tonal" color="warning" @click="chatsStore.resetChat(chatId)">Reset</v-btn>
          <v-btn density="compact" variant="tonal" color="error" @click="chatsStore.deleteChat(chatId)">Delete</v-btn>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-subtitle>
      Temperature: {{chat.settings.temperature}} | {{ chatsStore.getInferenceTokensPerSecond(chatId) }} T/s
    </v-card-subtitle>
    <v-card-text>
      <v-row>
        <v-col v-if="chatId !== ''" style="max-width: 900px">
          <v-card
              v-for="(message, index) in chatsStore.chats[chatId].messages"
              :key="index"
              :class="'role-' + message.role + ' mb-3'"
              variant="outlined"
          >
            <v-card-text v-if="!editMode">
              <div v-html="marked(message.content)"></div>
            </v-card-text>
            <v-card-text v-else>
              <v-textarea v-model="message.content" variant="outlined" auto-grow
                          density="compact" :hide-details=true></v-textarea>
            </v-card-text>
          </v-card>
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
import {marked} from 'marked';
import {useChatStore} from "@/stores/chats";

const chatsStore = useChatStore();
const editMode = ref(false);
const props = defineProps<{
  chatId: string
}>();
const chat = computed(() => {
  return chatsStore.chats[props.chatId];
})
</script>

<style>
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
  background: #9e7300;
}

.role-assistant {
  background: #271524;
  margin-right: 50px;
}

.role-user {
  background: #12141e;
  margin-left: 50px;
}
</style>