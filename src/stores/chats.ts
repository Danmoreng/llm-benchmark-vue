import {defineStore} from 'pinia';
import ollama from 'ollama/browser';
import type {Chat, ChatSettings, Role, IframeContent} from "@/types/generic";
import type {ChatResponse} from "ollama";
import {createSandboxedIframe, executeCodeInSandbox} from '@/sandbox';
import {useIframeStore} from '@/stores/iframeStore';

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
                messages: [{role: "system", content: settings.systemPrompt}],
                statistics: null,
            };
            return id;
        },

        deleteChat(id: string): void {
            delete this.chats[id];
        },

        resetChat(id: string): void {
            this.chats[id].messages = [{role: "system", content: this.chats[id].settings.systemPrompt}];
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

        async handleIframeTool(chatId: string, message: string, retries: number = 3): Promise<void> {
            const chat = this.chats[chatId];
            if (!chat) return;

            const iframeStore = useIframeStore();

            // Add the user message to the conversation history
            chat.messages.push({role: 'user', content: message});

            try {
                const initialResponse = await ollama.chat({
                    model: chat.settings.model,
                    messages: chat.messages,
                    temperature: chat.settings.temperature,
                    tools: [
                        {
                            type: 'function',
                            function: {
                                name: 'reasoning_step',
                                description: 'Make a reasoning step towards deciding how to update the iframe or to clarify things further.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        clarification: {
                                            type: 'string',
                                            description: 'Clarify reasoning before making the final decision.',
                                        },
                                    },
                                },
                            },
                        },
                        {
                            type: 'function',
                            function: {
                                name: 'update_iframe_code',
                                description: 'Update the content of an iframe with provided HTML, CSS, and JavaScript. Split the HTML, CSS, and JS appropriately.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        html: {type: 'string', description: 'The HTML content to update the iframe.'},
                                        css: {type: 'string', description: 'The CSS content to style the iframe.'},
                                        js: {type: 'string', description: 'The JavaScript to run inside the iframe.'},
                                    },
                                    required: ['html', 'css', 'js'],
                                },
                            }
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

                    // Check if the response contains a tool call
                    if (initialResponse.message.tool_calls) {
                        let attempts = 0;
                        let success = false;
                        let toolCallData: IframeContent | any = initialResponse.message.tool_calls[0].function.arguments;

while (attempts < retries && toolCallData && !success) {
    attempts++;

    // Handle reasoning steps
    if (initialResponse.message.tool_calls[0].function.name === 'reasoning_step') {
        // This is an intermediate reasoning step
        chat.messages.push({
            role: 'tool',
            content: `Reasoning: ${toolCallData.clarification}`,
        });

        // Request further reasoning or refinement
        const refinedResponse = await ollama.chat({
            model: chat.settings.model,
            messages: chat.messages,
            temperature: chat.settings.temperature,
        });

        // Check if refined response contains a tool call, if not exit reasoning loop
        if (refinedResponse && refinedResponse.message.tool_calls) {
            toolCallData = refinedResponse.message.tool_calls[0].function.arguments;
            continue; // Keep looping for further reasoning steps if necessary
        } else {
            // Normal message received, break the loop
            chat.messages.push({
                role: 'assistant',
                content: refinedResponse.message.content,
            });
            break;
        }
    }

    // Handle iframe update tool call
    if (initialResponse.message.tool_calls[0].function.name === 'update_iframe_code') {
        try {
            // Final step: update the iframe content
            iframeStore.updateIframeContent(toolCallData);
            chat.messages.push({
                role: 'assistant',
                content: JSON.stringify(toolCallData),
            });
            chat.messages.push({
                role: 'tool',
                content: JSON.stringify({ result: 'Iframe content updated successfully.' }),
            });
            success = true;

            // Send the updated conversation back to the model for a refined response
            const finalResponse = await ollama.chat({
                model: chat.settings.model,
                messages: chat.messages,
                temperature: chat.settings.temperature,
            });

            if (finalResponse) {
                chat.messages.push({
                    role: 'assistant',
                    content: finalResponse.message.content,
                });

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
        } catch (e: any) {
            chat.messages.push({
                role: 'tool',
                content: `Error updating iframe content: ${e.message}`,
            });

            // Request LLM to refine the tool call
            const retryResponse = await ollama.chat({
                model: chat.settings.model,
                messages: chat.messages,
                temperature: chat.settings.temperature,
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'update_iframe_code',
                            description: 'Update the content of an iframe with provided HTML, CSS, and JavaScript.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    html: {
                                        type: 'string',
                                        description: 'The HTML content to update the iframe.'
                                    },
                                    css: {
                                        type: 'string',
                                        description: 'The CSS content to style the iframe.'
                                    },
                                    js: {
                                        type: 'string',
                                        description: 'The JavaScript to run inside the iframe.'
                                    },
                                },
                                required: ['html', 'css', 'js'],
                            },
                        },
                    },
                ],
            });

            if (retryResponse.message.tool_calls) {
                toolCallData = retryResponse.message.tool_calls[0].function.arguments as IframeContent;
            } else {
                chat.messages.push({
                    role: 'assistant',
                    content: retryResponse.message.content,
                });
                break;  // Exit the retry loop if a normal response is received
            }
        }
    }
}

if (!success) {
    chat.messages.push({
        role: 'assistant',
        content: 'The tool call could not be executed successfully after several attempts.',
    });
}
                    } else {
                        // If there's no tool call, just handle the normal response
                        chat.messages.push({
                            role: 'assistant',
                            content: initialResponse.message.content,
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling tool calls:', error);
            }
        },


        async handleToolCalls(chatId: string, message: string, retries: number = 3): Promise<void> {
            const chat = this.chats[chatId];
            if (!chat) return;

            // Add the user message to the conversation history
            chat.messages.push({role: 'user', content: message});

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

                    // Check if the response contains a tool call
                    if (initialResponse.message.tool_calls) {
                        let attempts = 0;
                        let success = false;
                        let toolCallData = initialResponse.message.tool_calls[0].function.arguments;

                        while (attempts < retries && toolCallData && !success) {
                            attempts++;
                            try {
                                const {result, logs} = await executeCodeInSandbox(iframe, toolCallData.code);
                                chat.messages.push({
                                    role: 'tool',
                                    content: JSON.stringify({result, logs}),
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
                                } else {
                                    chat.messages.push({
                                        role: 'assistant',
                                        content: retryResponse.message.content,
                                    });
                                    break;  // Exit the retry loop if a normal response is received
                                }
                            }
                        }

                        if (!success) {
                            chat.messages.push({
                                role: 'assistant',
                                content: 'The tool call could not be executed successfully after several attempts.',
                            });
                        }
                    } else {
                        // If there's no tool call, just handle the normal response
                        chat.messages.push({
                            role: 'assistant',
                            content: initialResponse.message.content,
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
                if (chat.messages[0].role === 'system') {
                    chat.messages[0].content = prompt;
                } else {
                    chat.messages.unshift({role: 'system', content: prompt});
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
                chat.messages.push({role, content});
            }
        },
    },
});
