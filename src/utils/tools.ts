interface ToolDefinition {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: Record<string, { type: string; description: string }>;
            required: string[];
        };
    };
}

interface ToolHandlerResult {
    nextStep: 'success' | 'failure' | 'reasoning';
    data: any;
}

export const tools: Record<string, { definition: ToolDefinition; handler: (toolCallData: any, iframeStore: any, chat: any) => Promise<ToolHandlerResult> }> = {
    reasoning_step: {
        definition: {
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
                    required: [],
                },
            },
        },
        handler: async (toolCallData, iframeStore, chat) => {
            chat.messages.push({
                role: 'tool',
                content: `Reasoning: ${toolCallData.clarification}`,
            });
            return {
                nextStep: 'reasoning',
                data: toolCallData,
            };
        },
    },
    update_html: {
        definition: {
            type: 'function',
            function: {
                name: 'update_html',
                description: 'Update the HTML content of the iframe.',
                parameters: {
                    type: 'object',
                    properties: {
                        html: { type: 'string', description: 'The body content to update the inner HTML of the iframe. Does not include style or script tags! Only put html code inside the body tag here!' },
                    },
                    required: ['html'],
                },
            },
        },
        handler: async (toolCallData, iframeStore, chat) => {
            try {
                iframeStore.updateIframeHtml(toolCallData.html);
                chat.messages.push({
                    role: 'assistant',
                    content: `Updated HTML: ${toolCallData.html}`,
                });
                return {
                    nextStep: 'success',
                    data: toolCallData,
                };
            } catch (e: any) {
                chat.messages.push({
                    role: 'tool',
                    content: `Error updating HTML content: ${e.message}`,
                });
                return {
                    nextStep: 'failure',
                    data: toolCallData,
                };
            }
        },
    },
    update_css: {
        definition: {
            type: 'function',
            function: {
                name: 'update_css',
                description: 'Update the CSS content of the iframe.',
                parameters: {
                    type: 'object',
                    properties: {
                        css: { type: 'string', description: 'The CSS content to style the iframe.' },
                    },
                    required: ['css'],
                },
            },
        },
        handler: async (toolCallData, iframeStore, chat) => {
            try {
                iframeStore.updateIframeCss(toolCallData.css);
                chat.messages.push({
                    role: 'assistant',
                    content: `Updated CSS: ${toolCallData.css}`,
                });
                return {
                    nextStep: 'success',
                    data: toolCallData,
                };
            } catch (e: any) {
                chat.messages.push({
                    role: 'tool',
                    content: `Error updating CSS content: ${e.message}`,
                });
                return {
                    nextStep: 'failure',
                    data: toolCallData,
                };
            }
        },
    },
    update_js: {
        definition: {
            type: 'function',
            function: {
                name: 'update_js',
                description: 'Update the JavaScript content of the iframe.',
                parameters: {
                    type: 'object',
                    properties: {
                        js: { type: 'string', description: 'The JavaScript to run inside the iframe.' },
                    },
                    required: ['js'],
                },
            },
        },
        handler: async (toolCallData, iframeStore, chat) => {
            try {
                iframeStore.updateIframeJs(toolCallData.js);
                chat.messages.push({
                    role: 'assistant',
                    content: `Updated JavaScript: ${toolCallData.js}`,
                });
                return {
                    nextStep: 'success',
                    data: toolCallData,
                };
            } catch (e: any) {
                chat.messages.push({
                    role: 'tool',
                    content: `Error updating JavaScript content: ${e.message}`,
                });
                return {
                    nextStep: 'failure',
                    data: toolCallData,
                };
            }
        },
    },
    update_all: {
        definition: {
            type: 'function',
            function: {
                name: 'update_all',
                description: 'Update the entire content of the iframe with HTML, CSS, and JavaScript.',
                parameters: {
                    type: 'object',
                    properties: {
                        html: { type: 'string', description: 'The body content to update the inner HTML of the iframe. Does not include style or script tags! Only put html code inside the body tag here!' },
                        css: { type: 'string', description: 'The CSS content to style the iframe.' },
                        js: { type: 'string', description: 'The JavaScript to run inside the iframe.' },
                    },
                    required: ['html', 'css', 'js'],
                },
            },
        },
        handler: async (toolCallData, iframeStore, chat) => {
            try {
                iframeStore.updateIframeContent({
                    html: toolCallData.html,
                    css: toolCallData.css,
                    js: toolCallData.js,
                });
                chat.messages.push({
                    role: 'assistant',
                    content: `Updated HTML, CSS, and JavaScript in the iframe.`,
                });
                return {
                    nextStep: 'success',
                    data: toolCallData,
                };
            } catch (e: any) {
                chat.messages.push({
                    role: 'tool',
                    content: `Error updating iframe content: ${e.message}`,
                });
                return {
                    nextStep: 'failure',
                    data: toolCallData,
                };
            }
        },
    },
};
