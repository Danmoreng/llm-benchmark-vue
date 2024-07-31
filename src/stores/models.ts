import { defineStore } from 'pinia';
import OpenAI from 'openai';
import type {Model} from "@/types/generic";

const openai = new OpenAI({
    apiKey: 'sk-xxx',
    baseURL: 'http://localhost:11434/v1',
    dangerouslyAllowBrowser: true
});

interface ModelStoreState {
    models: Model[],
    selectedModel: Model | null,
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
                const response = await openai.models.list();
                this.models = response.data;
                this.selectedModel = this.models[0]
            } catch (err: any) {
                this.error = err.message || 'Failed to fetch models';
            } finally {
                this.loading = false;
            }
        }
    }
});
