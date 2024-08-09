export function createSandboxedIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-scripts');
    document.body.appendChild(iframe);

    // Inject the HTML and JavaScript into the iframe
    iframe.srcdoc = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Sandbox</title>
            <script>
                const originalConsoleLog = console.log;
                const logs = [];
                console.log = function(...args) {
                    logs.push(args);
                    originalConsoleLog.apply(console, args);
                };

                window.addEventListener('message', (event) => {
                    try {
                        const result = eval(event.data);
                        event.source.postMessage(JSON.stringify({ success: true, result, logs }), event.origin);
                    } catch (error) {
                        console.error('Error during execution:', error);
                        event.source.postMessage(JSON.stringify({ success: false, error: error.message, logs }), event.origin);
                    }
                });
            </script>
        </head>
        <body>
        </body>
        </html>
    `;
    return iframe;
}

export function executeCodeInSandbox(iframe: HTMLIFrameElement, code: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source === iframe.contentWindow) {
                console.log('Message received from sandbox:', event.data);
                window.removeEventListener('message', handleMessage);
                const result = JSON.parse(event.data);
                if (result.success) {
                    resolve({ result: result.result, logs: result.logs });
                } else {
                    reject(new Error(result.error));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        console.log('Sending code to sandbox:', code);
        iframe.contentWindow?.postMessage(code, '*');
    });
}
