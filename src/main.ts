import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'vuetify/styles';
import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import App from './App.vue';
import router from './router';

const customTheme: ThemeDefinition = {
    dark: false,
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

const app = createApp(App);
const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'customTheme',
        themes: {
            customTheme,
        },
    },
});

app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount('#app');
