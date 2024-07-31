import { defineStore } from 'pinia';
import { marked } from 'marked';
import ollama from 'ollama/browser';
import type {Conversation} from "@/types/generic";
import type {ChatResponse} from "ollama";

interface ChatState {
    conversations: Record<string, Conversation>;
    activeConversationIds: string[];
}

export const useChatStore = defineStore('chat', {
    state: (): ChatState => ({
        conversations: {},
        activeConversationIds: [],
    }),

    getters: {
        getConversationById: (state) => (id: string): Conversation | null => state.conversations[id] || null,

        getActiveConversations: (state): Conversation[] => {
            return state.activeConversationIds.map(id => state.conversations[id]).filter((conv): conv is Conversation => conv !== undefined);
        },
    },

    actions: {
        createConversation(modelName: string): string {
            const id = Date.now().toString();
            this.conversations[id] = {
                id,
                modelName,
                messages: [],
                systemPrompt: "You are a helpful chatbot. For testing purposes keep your answer very brief and concise. It must not be longer than three sentences.",
                temperature: 0.7,
                modelAnswer: "",
                modelAnswerHtml: "",
                finalResponseStatistics: null,
            };
            this.activeConversationIds.push(id);
            return id;
        },

        removeConversation(id: string): void {
            delete this.conversations[id];
            this.activeConversationIds = this.activeConversationIds.filter(convId => convId !== id);
        },

        setActiveConversations(ids: string[]): void {
            this.activeConversationIds = ids.filter(id => this.conversations[id]);
        },

        async sendMessage(conversationId: string, message: string): Promise<void> {
            const conversation = this.conversations[conversationId];
            if (!conversation) return;

            conversation.messages.push({ role: 'user', content: message });
            conversation.modelAnswer = "";
            conversation.modelAnswerHtml = "";
            conversation.finalResponseStatistics = null;

            try {
                const response = await (ollama.chat as any)({
                    model: conversation.modelName,
                    messages: [
                        { role: "system", content: conversation.systemPrompt },
                        ...conversation.messages,
                    ],
                    temperature: conversation.temperature,
                    stream: true,
                });

        let finalResponse: ChatResponse | undefined;

        for await (const part of response) {
          const messageContent = part.message.content;
          conversation.modelAnswer += messageContent;
          conversation.modelAnswerHtml = await marked(conversation.modelAnswer);
          if (part.done) {
            finalResponse = part;
          }
        }

        if (finalResponse) {
          console.log('Final response statistics:', finalResponse);
          conversation.finalResponseStatistics = {
            eval_count: finalResponse.eval_count || 0,
            eval_duration: finalResponse.eval_duration || 0,
            load_duration: finalResponse.load_duration || 0,
            prompt_eval_count: finalResponse.prompt_eval_count || 0,
            prompt_eval_duration: finalResponse.prompt_eval_duration || 0,
            total_duration: finalResponse.total_duration || 0,
          };
        }

                conversation.messages.push({
                    role: 'assistant',
                    content: conversation.modelAnswer,
                });
            } catch (error) {
                console.error('Error in chat completion:', error);
                conversation.modelAnswer = "An error occurred while processing your request.";
                conversation.modelAnswerHtml = await marked(conversation.modelAnswer);
            }
        },

        updateSystemPrompt(conversationId: string, prompt: string): void {
            const conversation = this.conversations[conversationId];
            if (conversation) {
                conversation.systemPrompt = prompt;
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
                conversation.modelAnswer = "";
                conversation.modelAnswerHtml = "";
                conversation.finalResponseStatistics = null;
            }
        },

        getPromptTokensPerSecond(conversationId: string): string {
            const conversation = this.conversations[conversationId];
            if (conversation && conversation.finalResponseStatistics && conversation.finalResponseStatistics.prompt_eval_count) {
                return (conversation.finalResponseStatistics.prompt_eval_count / (conversation.finalResponseStatistics.prompt_eval_duration / 1e9)).toFixed(2);
            }
            return "N/A";
        },

        getInferenceTokensPerSecond(conversationId: string): string {
            const conversation = this.conversations[conversationId];
            if (conversation && conversation.finalResponseStatistics && conversation.finalResponseStatistics.eval_count) {
                return (conversation.finalResponseStatistics.eval_count / (conversation.finalResponseStatistics.eval_duration / 1e9)).toFixed(2);
            }
            return "N/A";
        },
    },
});