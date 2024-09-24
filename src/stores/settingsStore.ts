import { defineStore } from 'pinia';

export interface SettingsState {
    activeTools: string[];
    retries: number;
}

export const useSettingsStore = defineStore('settings', {
    state: (): SettingsState => ({
        activeTools: ['reasoning_step', 'update_html', 'update_css', 'update_js', 'update_all'],
        retries: 3,
    })
});
