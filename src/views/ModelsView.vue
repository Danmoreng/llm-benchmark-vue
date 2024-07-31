<template>
  <v-container>
    <h1 class="mb-5">Manage Models</h1>
    <v-row>
      <v-col>
        <v-row>
          <v-col>
            <v-text-field
                variant="outlined"
                v-model="newModelName"
                label="Model Name"
                append-icon="mdi-download"
                :disabled="modelStore.loading"
            ></v-text-field>
            <v-btn @click="pullModelHandler">Download Model</v-btn>
          </v-col>
          <v-col>
            <v-alert type="error" v-if="modelStore.error">
              Failed to fetch models.
            </v-alert>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-table style="max-width: 900px">
              <thead>
              <tr>
                <th>Model</th>
                <th>Parameters</th>
                <th>Size</th>
                <th>Quantization</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="model in modelStore.models" :key="model.name">
                <td>{{ model.name }}</td>
                <td>{{ model.details.parameter_size }}</td>
                <td>{{ (model.size / (1024 * 1024 * 1024)).toFixed(2) }} GB</td>
                <td>{{ model.details.quantization_level }}</td>
                <td>
                  <v-btn color="error" @click="modelStore.deleteModel(model.name)">
                    Delete
                  </v-btn>
                </td>
              </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-col>
      <v-col>
        <pre class="mt-0">{{ modelStore.pullStatus }}</pre>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useModelStore} from '@/stores/models';

const modelStore = useModelStore();
const newModelName = ref('');

const pullModelHandler = () => {
  if (newModelName.value.trim()) {
    modelStore.pullModel(newModelName.value.trim());
    newModelName.value = '';
  }
};

onMounted(() => {
  modelStore.fetchModels();
});
</script>

<style scoped>
.v-container {
  margin-top: 20px;
}
</style>
