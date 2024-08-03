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
    systemPrompt: string;
    messages: Message[];
    temperature: number;
    statistics: ResponseStatistics | null;
}
