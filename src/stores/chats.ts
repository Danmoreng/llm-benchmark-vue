import { defineStore } from 'pinia';
import ollama from 'ollama/browser';
import type {Conversation} from "@/types/generic";
import type {ChatResponse} from "ollama";

interface ChatState {
    conversations: Record<string, Conversation>;
}

export const useChatStore = defineStore('chat', {
    state: (): ChatState => ({
        conversations: {}
    }),

    getters: {
        getConversationById: (state) => (id: string): Conversation | null => state.conversations[id] || null,
    },

    actions: {
        createConversation(modelName: string, systemPrompt: string): string {
            const id = Date.now().toString();
            this.conversations[id] = {
                id,
                modelName,
                messages: [{ role: "system", content: systemPrompt }],
                temperature: 0.7,
                statistics: null,
            };
            return id;
        },

        removeConversation(id: string): void {
            delete this.conversations[id];
        },

        async sendMessage(conversationId: string, message: string): Promise<void> {
            console.log('sendMessage', conversationId);
            const conversation = this.conversations[conversationId];
            console.log('from conversation', conversation);
            if (!conversation) return;

            conversation.messages.push({role: 'user', content: message});
            try {
                const response = await (ollama.chat as any)({
                    model: conversation.modelName,
                    messages: conversation.messages,
                    temperature: conversation.temperature,
                    stream: true,
                });

                let finalResponse: ChatResponse | undefined;
                conversation.messages.push({role: 'assistant', content: ""});
                const index = conversation.messages.length - 1;
                for await (const part of response) {
                    const messageContent = part.message.content;
                    conversation.messages[index].content += messageContent;
                    if (part.done) {
                        finalResponse = part;
                    }
                }

                if (finalResponse) {
                    console.log('Final response statistics:', finalResponse);
                    conversation.statistics = {
                        eval_count: finalResponse.eval_count || 0,
                        eval_duration: finalResponse.eval_duration || 0,
                        load_duration: finalResponse.load_duration || 0,
                        prompt_eval_count: finalResponse.prompt_eval_count || 0,
                        prompt_eval_duration: finalResponse.prompt_eval_duration || 0,
                        total_duration: finalResponse.total_duration || 0,
                    };
                }
            } catch (error) {
                console.error('Error in chat completion:', error);
            }
        },

        setSystemPrompt(conversationId: string, prompt: string): void {
            const conversation = this.conversations[conversationId];
            if (conversation) {
                if(conversation.messages[0].role === 'system'){
                    conversation.messages[0].content = prompt;
                } else {
                    conversation.messages.unshift({ role: 'system', content: prompt });
                }
            }
        },

        updateTemperature(conversationId: string, temp: number): void {
            const conversation = this.conversations[conversationId];
            if (conversation) {
                conversation.temperature = temp;
            }
        },

        clearConversation(conversationId: string): void {
            const conversation = this.conversations[conversationId];
            if (conversation) {
                conversation.messages = [];
                conversation.statistics = null;
            }
        },

        getPromptTokensPerSecond(conversationId: string): string {
            const conversation = this.conversations[conversationId];
            if (conversation && conversation.statistics && conversation.statistics.prompt_eval_count) {
                return (conversation.statistics.prompt_eval_count / (conversation.statistics.prompt_eval_duration / 1e9)).toFixed(2);
            }
            return "N/A";
        },

        getInferenceTokensPerSecond(conversationId: string): string {
            const conversation = this.conversations[conversationId];
            if (conversation && conversation.statistics && conversation.statistics.eval_count) {
                return (conversation.statistics.eval_count / (conversation.statistics.eval_duration / 1e9)).toFixed(2);
            }
            return "N/A";
        },
    },
});