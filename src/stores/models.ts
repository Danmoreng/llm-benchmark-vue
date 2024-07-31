import { defineStore } from 'pinia';
import ollama from 'ollama/browser';
import {type ModelResponse} from "ollama/browser";


interface ModelStoreState {
    models: ModelResponse[],
    selectedModel: ModelResponse | null,
    loading: boolean,
    error: boolean
}

export const useModelStore = defineStore({
    id: 'model',
    state: (): ModelStoreState => ({
        models: [],
        selectedModel: null,
        loading: false,
        error: false
    }),
    getters: {
        modelCount: (state) => state.models.length
    },
    actions: {
        async fetchModels() {
            this.loading = true;
            this.error = false;
            try {
                const response = await ollama.list();
                this.models = response.models.sort((a, b) => a.size - b.size);
                this.selectedModel = this.models[0];
            } catch (err: any) {
                console.log(err.message || 'Failed to fetch models');
                this.error = true;
            } finally {
                this.loading = false;
            }
        }
    }
});
