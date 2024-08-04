import { defineStore } from 'pinia';
import ollama from 'ollama/browser';
import type {Chat, ChatSettings} from "@/types/generic";
import type {ChatResponse} from "ollama";

interface ChatState {
    chats: Record<string, Chat>;
}

export const useChatStore = defineStore('chat', {
    state: (): ChatState => ({
        chats: {}
    }),

    getters: {
        getchatById: (state) => (id: string): Chat | null => state.chats[id] || null,
    },

    actions: {
        createChat(settings: ChatSettings): string {
            const id = Date.now().toString();
            this.chats[id] = {
                id,
                settings,
                messages: [{ role: "system", content: settings.systemPrompt }],
                statistics: null,
            };
            return id;
        },

        removechat(id: string): void {
            delete this.chats[id];
        },

        resetChat(id: string): void {
          this.chats[id].messages = [{ role: "system", content: this.chats[id].settings.systemPrompt }];
        },

        async sendMessage(chatId: string, message: string): Promise<void> {
            console.log('sendMessage', chatId);
            const chat = this.chats[chatId];
            console.log('from chat', chat);
            if (!chat) return;

            chat.messages.push({role: 'user', content: message});
            try {
                const response = await (ollama.chat as any)({
                    model: chat.settings.model,
                    messages: chat.messages,
                    temperature: chat.settings.temperature,
                    stream: true,
                });

                let finalResponse: ChatResponse | undefined;
                chat.messages.push({role: 'assistant', content: ""});
                const index = chat.messages.length - 1;
                for await (const part of response) {
                    const messageContent = part.message.content;
                    chat.messages[index].content += messageContent;
                    if (part.done) {
                        finalResponse = part;
                    }
                }

                if (finalResponse) {
                    console.log('Final response statistics:', finalResponse);
                    chat.statistics = {
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

        setSystemPrompt(chatId: string, prompt: string): void {
            const chat = this.chats[chatId];
            if (chat) {
                if(chat.messages[0].role === 'system'){
                    chat.messages[0].content = prompt;
                } else {
                    chat.messages.unshift({ role: 'system', content: prompt });
                }
            }
        },

        clearchat(chatId: string): void {
            const chat = this.chats[chatId];
            if (chat) {
                chat.messages = [];
                chat.statistics = null;
            }
        },

        getPromptTokensPerSecond(chatId: string): string {
            const chat = this.chats[chatId];
            if (chat && chat.statistics && chat.statistics.prompt_eval_count) {
                return (chat.statistics.prompt_eval_count / (chat.statistics.prompt_eval_duration / 1e9)).toFixed(2);
            }
            return "N/A";
        },

        getInferenceTokensPerSecond(chatId: string): string {
            const chat = this.chats[chatId];
            if (chat && chat.statistics && chat.statistics.eval_count) {
                return (chat.statistics.eval_count / (chat.statistics.eval_duration / 1e9)).toFixed(2);
            }
            return "N/A";
        },
    },
});