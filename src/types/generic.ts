type Role = 'system' | 'user' | 'assistant';

export interface Message {
    role: Role;
    content: string;
}

export interface ResponseStatistics {
    eval_count: number;
    eval_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    total_duration: number;
}

export interface Conversation {
    id: string;
    modelName: string;
    messages: Message[];
    systemPrompt: string;
    temperature: number;
    modelAnswer: string;
    modelAnswerHtml: string;
    finalResponseStatistics: ResponseStatistics | null;
}

export interface ChatResponse {
    model: string;
    created_at: string;
    message: Message;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}