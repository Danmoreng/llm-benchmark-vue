<template>
  <main>
    <p class="small-text">ChatId: {{chatId}}</p>
    <div class="textarea-container">
      <label for="systemPrompt">System Prompt:</label>
      <textarea id="systemPrompt" v-model="systemPrompt"></textarea>
    </div>
    <div class="textarea-container">
      <label for="pdfUpload">Upload PDF:</label>
      <input type="file" ref="pdfInput" accept="application/pdf">
    </div>
    <div class="textarea-container">
      <label for="userMessage">User Input:</label>
      <textarea id="userMessage" v-model="userMessage"></textarea>
    </div>
    <button @click="sendChat">Send</button>
    <br>
    <br>
    <label>Model Output:</label>
    <p class="small-text">Processing time: {{processingTime}}</p>
    <div class="model-answer" v-html="modelAnswerHtml"></div>
  </main>
</template>

<script setup>
import {ref} from 'vue';
import {marked} from "marked";


const systemPrompt = ref("You are a helpful chatbot. Your task is, to extract information from a document based on a JSON schema the user provides. You will answer only in JSON and respond with the exact schema the user provided. If you cannot find information matching the criteria, the data in your output JSON is null.");
const userMessage = ref("{\n" +
    "  \"account_holder\": \"string\",\n" +
    "  \"bank_name\": \"string\",\n" +
    "  \"fees_paid\": \"number\",\n" +
    "  \"interest_paid\": \"number\",\n" +
    "  \"interest_received\": \"number\",\n" +
    "  \"account_number\": \"string\",\n" +
    "  \"iban\": \"string\",\n" +
    "  \"start_date\": \"date\",\n" +
    "  \"end_date\": \"date\"\n" +
    "}");
const modelAnswer = ref("");
const modelAnswerHtml = ref("");
const pdfInput = ref(null);
const processingTime = ref(0);
const chatId = ref(null);

async function sendChat() {
  modelAnswer.value = "";
  const formData = new FormData();
  formData.append("systemPrompt", systemPrompt.value);
  formData.append("message", userMessage.value);
  if(chatId.value !== null){
    formData.append("chatId", chatId);
  }
  const selectedFile = pdfInput.value.files[0];
  if(selectedFile && selectedFile.type === 'application/pdf'){
    formData.append("pdf", selectedFile);
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const json = await response.json();
    modelAnswer.value = json.message.content;
    modelAnswerHtml.value = marked.parse(modelAnswer.value);
    processingTime.value = json.processingTime;
    chatId.value = json.chatId;
  } else {
    console.error('Error:', response.statusText);
  }
}

</script>

<style>
html, body {
  font-family: Segoe UI, sans-serif;
  background-color: #f3f3f3;
  margin: 0;
  padding: 0;
}

main {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.textarea-container {
  margin-bottom: 1rem;
}

textarea {
  width: 100%;
  height: 100px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

input[type="file"] {
  display: block;
  margin-top: 0.5rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.model-answer {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 4px;
  white-space: pre-wrap; /* Ensure that line breaks are preserved */
}

.small-text {
  font-size: 0.8rem;
  line-height: 0.5rem;
}
</style>