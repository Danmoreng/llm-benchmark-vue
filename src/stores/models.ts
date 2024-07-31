import {defineStore} from 'pinia';
import ollama from 'ollama/browser';
import type {ModelResponse, PullRequest, DeleteRequest} from "ollama/browser";


interface ModelStoreState {
    models: ModelResponse[],
    selectedModel: ModelResponse | null,
    loading: boolean,
    error: boolean,
    pullStatus: any
}

export const useModelStore = defineStore({
    id: 'model',
    state: (): ModelStoreState => ({
        models: [],
        selectedModel: null,
        loading: false,
        error: false,
        pullStatus: null
    }),
    getters: {
        modelCount: (state) => state.models.length,
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
        },
        async pullModel(modelName: string) {
            this.loading = true;
            this.error = false;
            try {
                const request: PullRequest = {
                    model: modelName,
                    stream: true
                }
                const response = await ollama.pull(request as any);

                for await (const part of response) {
                    this.pullStatus = part;
                }
                await this.fetchModels();
            } catch (err: any) {
                console.log(err.message || 'Failed to pull model');
                this.error = true;
            } finally {
                this.loading = false;
            }
        },
        async deleteModel(modelName: string) {
            this.loading = true;
            this.error = false;
            try {
                const request: DeleteRequest = {
                    model: modelName
                }
                await ollama.delete(request);
                await this.fetchModels();
            } catch (err: any) {
                console.log(err.message || 'Failed to delete model');
                this.error = true;
            } finally {
                this.loading = false;
            }
        },
    },
});
