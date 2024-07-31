import { defineStore } from 'pinia';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: 'sk-xxx',
    baseURL: 'http://localhost:11434/v1',
    dangerouslyAllowBrowser: true
});

export const useModelStore = defineStore({
    id: 'model',
    state: () => ({
        models: [],
        selectedModel: null,
        loading: false,
        error: null
    }),
    getters: {
        modelCount: (state) => state.models.length
    },
    actions: {
        async fetchModels() {
            this.loading = true;
            this.error = null;
            try {
                const response = await openai.models.list();
                this.models = response.data;
                this.selectedModel = this.models[0]
            } catch (err) {
                this.error = err.message || 'Failed to fetch models';
            } finally {
                this.loading = false;
            }
        }
    }
});
