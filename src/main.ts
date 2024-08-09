import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles';
import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import App from './App.vue';
import router from './router';

const darkTheme: ThemeDefinition = {
    dark: true,
    variables: {
        '--pre-background': '#3e3e3e',
        '--role-system-background': '#ba7100',
        '--role-assistant-background': '#35002d',
        '--role-user-background': '#303030'
    },
    colors: {
        background: '#272727',
        surface: '#131313',
        primary: '#0b8b0e',
        secondary: '#085f57',
        error: '#B00020',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FB8C00',
    },
}

const lightTheme = {
    dark: false,
    variables: {
        '--pre-background': '#d8e2dc',
        '--role-system-background': '#ba7100',
        '--role-assistant-background': '#35002d',
        '--role-user-background': '#303030'
    },
    colors: {
        background: '#f4f0f0',
        surface: '#CED3DC',
        primary: '#4E8098',
        secondary: '#90C2E7',
        error: '#B00020',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FB8C00',
    },
};

const app = createApp(App);
const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'lightTheme',
        themes: {
            lightTheme,
            darkTheme,
        },
    },
});

app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount('#app');
