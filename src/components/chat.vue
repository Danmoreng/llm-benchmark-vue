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
          label="Upload PDF"
          ref="pdfInput"
          accept="application/pdf"
          @change="handleFileUpload"
        ></v-file-input>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-select
          v-model="modelStore.selectedModel"
          :items="modelStore.models"
          item-title="id"
          return-object
          label="Select Model"
          variant="outlined"
          density="compact"
        ></v-select>
      </v-col>
      <v-col>
        <v-slider
          v-model="temperature"
          label="Temperature"
          min="0"
          max="1"
          step="0.01"
          thumb-label
        ></v-slider>
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
        <span class="small-text">Processing Time: {{processingTime}}</span>
      </v-col>
      <v-col>
        <v-btn variant="flat" color="primary" block @click="sendChat">Send</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card variant="flat" style="max-width: 700px">
          <v-card-title>Model Answer</v-card-title>
            <v-card-text v-html="modelAnswerHtml"></v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import OpenAI from 'openai';
import { marked } from 'marked';
import { useModelStore } from '../stores/models';

const modelStore = useModelStore();
onMounted(() => {
  modelStore.fetchModels();
});

const systemPrompt = ref("You are a helpful chatbot.");
const userMessage = ref("Why is the sky blue?");
const modelAnswer = ref("");
const modelAnswerHtml = ref("");
const temperature = ref(0.7);

const openai = new OpenAI({
  apiKey: 'sk-xxx', // Dummy API key
  baseURL: 'http://localhost:11434/v1', // Ollama API endpoint
  dangerouslyAllowBrowser: true
});

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
  modelAnswer.value = "";
  modelAnswerHtml.value = "";

  try {
    const stream = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt.value },
        { role: "user", content: userMessage.value }
      ],
      model: modelStore.selectedModel.id,
      temperature: temperature.value,
      stream: true
    });

    for await (const part of stream) {
      const message = part.choices[0]?.delta?.content || "";
      modelAnswer.value += message;
      modelAnswerHtml.value = marked(modelAnswer.value);
    }
  } catch (error) {
    console.error('Error in chat completion:', error);
    modelAnswer.value = "An error occurred while processing your request.";
    modelAnswerHtml.value = marked(modelAnswer.value);
  }
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
</style>