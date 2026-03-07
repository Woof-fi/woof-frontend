import { mount } from 'svelte';
import App from './App.svelte';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fortawesome/fontawesome-svg-core/styles.css';  // FA SVG core styles (sizing, animation)
import '../js/icons.js';  // Registers only the ~84 icons we actually use
import '../css/global.css';
import '../css/styles.css';
import { showToast } from '../js/utils.js';

// Build metadata (injected at build time by Vite)
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;
(window as any).__BUILD__ = {
    commit: typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'dev',
    buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev',
};
console.info(`[woof] build ${(window as any).__BUILD__.commit} @ ${(window as any).__BUILD__.buildTime}`);

const app = mount(App, { target: document.getElementById('app')! });
export default app;

// Auto-reload when new service worker activates (fixes stale cache on mobile/PWA)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                    // New version activated — brief toast then reload
                    showToast('Updating to latest version...', 'info');
                    setTimeout(() => window.location.reload(), 1500);
                }
            });
        });
    });
}
