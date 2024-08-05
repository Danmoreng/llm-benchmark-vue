<template>
  <v-card :class="'role-' + message.role + ' mb-3'" variant="flat">
    <v-card-text v-if="!editMode">
      <div v-html="marked(message.content)"></div>
    </v-card-text>
    <v-card-text v-else>
      <v-row>
        <v-col cols="8">
          <v-select
            v-model="message.role"
            :items="roles"
            label="Role"
            variant="outlined"
            density="compact"
            :hide-details="true"
          ></v-select>
        </v-col>
        <v-col cols="4">
          <v-btn variant="flat" color="error" @click="deleteMessage">
            Delete
          </v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-textarea
            v-model="message.content"
            variant="outlined"
            auto-grow
            density="compact"
            :hide-details="true"
          ></v-textarea>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { marked } from 'marked';
import { useChatStore } from "@/stores/chats";
import type {Message} from "@/types/generic";

const props = defineProps<{
  message: Message,
  editMode: boolean,
  index: number,
  chatId: string
}>();

const roles = ["system", "user", "assistant"];
const chatsStore = useChatStore();

function deleteMessage() {
  chatsStore.deleteMessage(chatsStore.chats[props.chatId].id, props.index);
}
</script>
