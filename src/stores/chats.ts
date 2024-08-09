import { defineStore } from 'pinia';
import ollama from 'ollama/browser';
import type { Chat, ChatSettings, Role } from "@/types/generic";
import type { ChatResponse } from "ollama";
import { createSandboxedIframe, executeCodeInSandbox } from '@/sandbox';

interface ChatState {
    chats: Record<string, Chat>;
}

export const useChatStore = defineStore('chat', {
    state: (): ChatState => ({
        chats: {}
    }),

    getters: {
        getChatById: (state) => (id: string): Chat | null => state.chats[id] || null,
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

        deleteChat(id: string): void {
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

        async handleToolCalls(chatId: string, message: string, retries: number = 3): Promise<void> {
            const chat = this.chats[chatId];
            if (!chat) return;

            // Add the user message to the conversation history
            chat.messages.push({ role: 'user', content: message });

            const iframe = createSandboxedIframe();

            try {
                const initialResponse = await (ollama.chat as any)({
                    model: chat.settings.model,
                    messages: chat.messages,
                    temperature: chat.settings.temperature,
                    tools: [
                        {
                            type: 'function',
                            function: {
                                name: 'execute_js_code',
                                description: 'Execute arbitrary JavaScript code',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        code: {
                                            type: 'string',
                                            description: 'The JavaScript code to execute',
                                        },
                                    },
                                    required: ['code'],
                                },
                            },
                        },
                    ],
                });

                if (initialResponse) {
                    console.log('Initial response statistics:', initialResponse);
                    chat.statistics = {
                        eval_count: initialResponse.eval_count || 0,
                        eval_duration: initialResponse.eval_duration || 0,
                        load_duration: initialResponse.load_duration || 0,
                        prompt_eval_count: initialResponse.prompt_eval_count || 0,
                        prompt_eval_duration: initialResponse.prompt_eval_duration || 0,
                        total_duration: initialResponse.total_duration || 0,
                    };

                    // Process function calls made by the model
                    let attempts = 0;
                    let success = false;
                    let toolCallData = initialResponse.message.tool_calls ? initialResponse.message.tool_calls[0].function.arguments : null;

                    while (attempts < retries && toolCallData && !success) {
                        attempts++;
                        try {
                            const { result, logs } = await executeCodeInSandbox(iframe, toolCallData.code);
                            chat.messages.push({
                                role: 'tool',
                                content: JSON.stringify({ result, logs }),
                            });
                            success = true;

                            // Send the updated conversation back to the model for a refined response
                            const refinedResponse = await (ollama.chat as any)({
                                model: chat.settings.model,
                                messages: chat.messages,
                                temperature: chat.settings.temperature,
                            });

                            if (refinedResponse) {
                                chat.messages.push({
                                    role: 'assistant',
                                    content: refinedResponse.message.content,
                                });

                                console.log('Refined response statistics:', refinedResponse);
                                chat.statistics = {
                                    eval_count: refinedResponse.eval_count || 0,
                                    eval_duration: refinedResponse.eval_duration || 0,
                                    load_duration: refinedResponse.load_duration || 0,
                                    prompt_eval_count: refinedResponse.prompt_eval_count || 0,
                                    prompt_eval_duration: refinedResponse.prompt_eval_duration || 0,
                                    total_duration: refinedResponse.total_duration || 0,
                                };
                            }
                        } catch (e: any) {
                            chat.messages.push({
                                role: 'tool',
                                content: `Error executing code: ${e.message}`,
                            });

                            // Request LLM to refine the tool call
                            const retryResponse = await (ollama.chat as any)({
                                model: chat.settings.model,
                                messages: chat.messages,
                                temperature: chat.settings.temperature,
                                tools: [
                                    {
                                        type: 'function',
                                        function: {
                                            name: 'execute_js_code',
                                            description: 'Execute arbitrary JavaScript code',
                                            parameters: {
                                                type: 'object',
                                                properties: {
                                                    code: {
                                                        type: 'string',
                                                        description: 'The JavaScript code to execute',
                                                    },
                                                },
                                                required: ['code'],
                                            },
                                        },
                                    },
                                ],
                            });

                            if (retryResponse.message.tool_calls) {
                                toolCallData = retryResponse.message.tool_calls[0].function.arguments;
                            }
                        }
                    }

                    if (!success) {
                        chat.messages.push({
                            role: 'assistant',
                            content: 'The tool call could not be executed successfully after several attempts.',
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling tool calls:', error);
            } finally {
                document.body.removeChild(iframe);
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

        clearChat(chatId: string): void {
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

        deleteMessage(chatId: string, index: number): void {
            const chat = this.chats[chatId];
            if (chat) {
                chat.messages.splice(index, 1);
            }
        },

        addMessage(chatId: string, role: Role, content: string = ''): void {
            const chat = this.chats[chatId];
            if (chat) {
                chat.messages.push({ role, content });
            }
        },
    },
});
