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
          item-title="model"
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
      <v-col v-if="finalResponseStatistics">
        <v-table density="compact">
          <thead>
          <tr>
            <th colspan="2">Response Statistics</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Evaluation Duration</td>
            <td>{{ (finalResponseStatistics.eval_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Load Duration</td>
            <td>{{ (finalResponseStatistics.load_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Prompt Evaluation Duration</td>
            <td>{{ (finalResponseStatistics.prompt_eval_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Prompt Tokens per Second</td>
            <td>{{ promptTokensPerSecond }} T/s</td>
          </tr>
          <tr>
            <td>Total Duration</td>
            <td>{{ (finalResponseStatistics.total_duration / 1e9).toFixed(3) }} seconds</td>
          </tr>
          <tr>
            <td>Inference Tokens per Second</td>
            <td>{{ inferenceTokensPerSecond }} T/s</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { marked } from 'marked';
import { useModelStore } from '../stores/models';
import ollama from 'ollama/browser'; // Importing Ollama for browser

const modelStore = useModelStore();
onMounted(() => {
  modelStore.fetchModels();
});

const systemPrompt = ref("You are a helpful chatbot. For testing purposes keep your answer very brief and concise. It must not be longer than three sentences.");
const userMessage = ref("Why is the sky blue?");
const modelAnswer = ref("");
const modelAnswerHtml = ref("");
const temperature = ref(0.7);
const finalResponseStatistics = ref(null);

const promptTokensPerSecond = computed(() => {
  if (finalResponseStatistics.value && finalResponseStatistics.value.prompt_eval_count) {
    return (finalResponseStatistics.value.prompt_eval_count / (finalResponseStatistics.value.prompt_eval_duration / 1e9)).toFixed(2);
  }
  return "N/A";
});

const inferenceTokensPerSecond = computed(() => {
  if (finalResponseStatistics.value && finalResponseStatistics.value.eval_count) {
    return (finalResponseStatistics.value.eval_count / (finalResponseStatistics.value.total_duration / 1e9)).toFixed(2);
  }
  return "N/A";
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
  finalResponseStatistics.value = null;

  try {
    const message = { role: 'user', content: userMessage.value };
    const response = await ollama.chat({
      model: modelStore.selectedModel.model,
      messages: [
        { role: "system", content: systemPrompt.value },
        message
      ],
      temperature: temperature.value,
      stream: true
    });

    let finalResponse;
    for await (const part of response) {
        const messageContent = part.message.content;
        modelAnswer.value += messageContent;
        modelAnswerHtml.value = marked(modelAnswer.value);
        finalResponse = part; // Keep updating finalResponse with the latest part
    }

    // Log the statistics from the final response
    if (finalResponse) {
        console.log('Final response statistics:', finalResponse);
        finalResponseStatistics.value = finalResponse; // Store the statistics
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