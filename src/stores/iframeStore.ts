// stores/iframeStore.ts
import {defineStore} from 'pinia';

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

    // Fix the newlines in HTML, CSS, and JS content
    getIframeContent(state): string {
      const currentContent = state.versions[state.currentVersion];

      // Ensure that newlines in content don't cause rendering issues
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
        updateIframeContent(newContent: IframeContent) {
            this.versions.push(newContent);
            this.currentVersion = this.versions.length - 1;
        },

        switchVersion(versionIndex: number) {
            if (versionIndex >= 0 && versionIndex < this.versions.length) {
                this.currentVersion = versionIndex;
            }
        },

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
