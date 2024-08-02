<template>
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
      <v-col>
        <v-file-input
            variant="solo-inverted"
            label="Upload PDF"
            ref="pdfInput"
            accept="application/pdf"
            @change="handleFileUpload"
        ></v-file-input>
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
      <v-col>
        <v-textarea
            label="User Input"
            v-model="userMessage"
            variant="outlined"
            density="compact"
        ></v-textarea>
      </v-col>
      <v-col>
        <v-btn variant="flat" color="primary" block @click="sendChat">Send</v-btn>
      </v-col>
      <v-col>
        <v-btn variant="flat" color="info" block @click="editMode = !editMode">Toggle Edit Mode</v-btn>
      </v-col>
    </v-row>
    <v-row>
    <v-col v-if="chatId !== ''" style="max-width: 900px">
        <v-card
            v-for="(message, index) in chatsStore.conversations[chatId].messages"
            :key="index"
            :class="'role-' + message.role + ' mb-3'"
            variant="outlined"
        >
          <v-card-text v-if="!editMode">
            <div v-html="marked(message.content)"></div>
          </v-card-text>
          <v-card-text v-else>
            <v-textarea v-model="message.content" variant="outlined" auto-grow
                        density="compact" hide-details=true></v-textarea>
          </v-card-text>
        </v-card>
    </v-col>
      <v-col v-if="chatId !== '' && chatsStore.conversations[chatId].statistics !== null">
        <v-table density="compact">
          <thead>
          <tr>
            <th colspan="2">Response Statistics</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Evaluation Duration</td>
            <td>{{ (chatsStore.conversations[chatId].statistics.eval_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Load Duration</td>
            <td>{{ (chatsStore.conversations[chatId].statistics.load_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Prompt Evaluation Duration</td>
            <td>{{ (chatsStore.conversations[chatId].statistics.prompt_eval_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Prompt Tokens per Second</td>
            <td>{{ chatsStore.getPromptTokensPerSecond(chatId) }} T/s</td>
          </tr>
          <tr>
            <td>Total Duration</td>
            <td>{{ (chatsStore.conversations[chatId].statistics.total_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Inference Tokens per Second</td>
            <td>{{ chatsStore.getInferenceTokensPerSecond(chatId) }} T/s</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import {marked} from 'marked';
import {useModelStore} from '../stores/models';
import {useChatStore} from "../stores/chats";

const modelStore = useModelStore();
const chatsStore = useChatStore();
const chatId = ref("");
const editMode = ref(false);
onMounted(() => {
  modelStore.fetchModels();
});

const systemPrompt = ref("You are a helpful chatbot. For testing purposes keep your answer very brief and concise. It must not be longer than three sentences.");
const userMessage = ref("Why is the sky blue?");
const temperature = ref(0.7);

async function handleFileUpload(file) {
  if (file && file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    try {
      // Note: PDF extraction logic is commented out as it requires additional setup
      // You may need to add PDF.js or a similar library to handle PDF extraction
      // const pdfDoc = await getDocument(new Uint8Array(arrayBuffer)).promise;
      // let finalText = '';
      // for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      //   const page = await pdfDoc.getPage(pageNum);
      //   const textContent = await page.getTextContent();
      //   const pageText = textContent.items.map(item => item.str).join(' ');
      //   finalText += pageText + '\n\n';
      // }
      // systemPrompt.value += `\n\nExtracted PDF Text:\n${finalText}`;
      console.log("PDF uploaded successfully");
    } catch (error) {
      console.error('Error reading PDF: ', error);
    }
  }
}

async function sendChat() {
  console.log('clicked');
  console.log(chatsStore.conversations);
  if(chatId.value === ""){
    console.log('create chat');
    chatId.value = chatsStore.createConversation(modelStore.selectedModel.model, systemPrompt.value);
    console.log('chat id: ', chatId.value);
  }
  console.log('generating response');
  await chatsStore.sendMessage(chatId.value, userMessage.value);
}
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