<template>
  <main>
    <v-container>
      <v-row>
        <v-col>
          <v-btn color="primary" variant="tonal" @click="openChatModal">Create New Chat</v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="chat in chatsStore.chats" :key="chat.id">
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
              @keydown.enter="sendChat"
          ></v-textarea>
        </v-col>
        <v-col cols="2">
          <v-btn variant="flat" color="primary" @click="sendChat">Send</v-btn>
        </v-col>
      </v-row>
    </v-container>
    <CreateChatModal ref="chatModal" />
  </main>
</template>

<script setup lang="ts">
import Chat from "@/components/chat.vue";
import { useChatStore } from "@/stores/chats";
import { ref } from "vue";
import CreateChatModal from "@/components/CreateChatModal.vue";
import CardComponent from "@/components/CardComponent.vue";

const chatsStore = useChatStore();
const userMessage = ref("Why is the sky blue?");
const chatModal = ref(null);

function openChatModal() {
  chatModal.value.open();
}

async function sendChat() {
  if (userMessage.value.trim() !== "") {
    const message = userMessage.value;
    userMessage.value = "";

    const promises = Object.keys(chatsStore.chats).map(chatId =>
        chatsStore.sendMessage( chatId, message)
    );

    await Promise.all(promises);
  }
}

</script>