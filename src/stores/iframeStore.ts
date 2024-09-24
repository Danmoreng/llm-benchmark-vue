// stores/iframeStore.ts
import { defineStore } from 'pinia';

interface IframeContent {
    html: string;
    css: string;
    js: string;
}

interface IframeState {
    currentVersion: number;
    versions: IframeContent[];
}

export const useIframeStore = defineStore('iframe', {
    state: (): IframeState => ({
        currentVersion: 0,
        versions: [
            {
                html: '<h1>Hello World</h1>',
                css: 'body { background-color: #f0f0f0; }',
                js: 'console.log("Hello World!");',
            },
        ],
    }),

    getters: {
        getCurrentContent(state): IframeContent {
            return state.versions[state.currentVersion];
        },

        getVersionCount(state): number {
            return state.versions.length;
        },

        // Prepare the full iframe content as a single string (HTML, CSS, and JS combined)
        getIframeContent(state): string {
            const currentContent = state.versions[state.currentVersion];

            // Ensure newlines in content don't cause rendering issues
            const html = currentContent.html.replace(/\n/g, '').trim();
            const css = currentContent.css.replace(/\n/g, '').trim();
            const js = currentContent.js.replace(/\n/g, '').trim();

            return `
                <html>
                    <head>
                        <style>${css}</style>
                    </head>
                    <body>
                        ${html}
                        <script>${js}<\/script>
                    </body>
                </html>
            `;
        },
    },

    actions: {
        // Update the iframe content with a new set of HTML, CSS, and JS
        updateIframeContent(newContent: IframeContent) {
            this.versions.push(newContent);
            this.currentVersion = this.versions.length - 1;
        },

        // Update only the HTML of the iframe, keeping other content intact
        updateIframeHtml(newHtml: string) {
            const current = { ...this.$state.versions[this.$state.currentVersion] }; // Access state directly
            current.html = newHtml;
            this.versions.push(current);
            this.currentVersion = this.versions.length - 1;
        },

        // Update only the CSS of the iframe, keeping other content intact
        updateIframeCss(newCss: string) {
            const current = { ...this.$state.versions[this.$state.currentVersion] }; // Access state directly
            current.css = newCss;
            this.versions.push(current);
            this.currentVersion = this.versions.length - 1;
        },

        // Update only the JavaScript of the iframe, keeping other content intact
        updateIframeJs(newJs: string) {
            const current = { ...this.$state.versions[this.$state.currentVersion] }; // Access state directly
            current.js = newJs;
            this.versions.push(current);
            this.currentVersion = this.versions.length - 1;
        },

        // Switch to a specific version of the iframe content
        switchVersion(versionIndex: number) {
            if (versionIndex >= 0 && versionIndex < this.versions.length) {
                this.currentVersion = versionIndex;
            }
        },

        // Reset the iframe content to the initial state
        resetIframeContent() {
            this.versions = [
                {
                    html: '<h1>Hello World</h1>',
                    css: 'body { background-color: #f0f0f0; }',
                    js: 'console.log("Hello World!");',
                },
            ];
            this.currentVersion = 0;
        },
    },
});
