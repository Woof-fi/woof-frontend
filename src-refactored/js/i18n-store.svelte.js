/**
 * i18n Store — Svelte 5 reactive internationalization
 *
 * Custom $state-based store (svelte-i18n is NOT compatible with Svelte 5 runes).
 * Supports English (en) and Finnish (fi) with static JSON imports (no FOUC).
 *
 * Usage in components:
 *   import { t, localName, locale } from '../../js/i18n-store.svelte.js';
 *   <p>{t('nav.home')}</p>
 *   <span>{localName(breed)}</span>
 *   <span>{locale.current}</span>  // reactive current locale ('en' | 'fi')
 */

import en from '../locales/en.json';
import fi from '../locales/fi.json';

const translations = { en, fi };

// --- Locale detection ---
function detectLocale() {
    try {
        const saved = localStorage.getItem('woof_locale');
        if (saved === 'fi' || saved === 'en') return saved;
    } catch { /* ignore */ }

    // Check browser language
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('fi')) return 'fi';

    return 'en';
}

// --- Reactive state ---
// Wrapped in an object so the export itself is never reassigned (Svelte 5 module rule).
// Components read `locale.current` which is reactive via $state.
export const locale = $state({ current: detectLocale() });

/**
 * Set locale and persist to localStorage.
 * @param {'en' | 'fi'} code
 */
export function setLocale(code) {
    if (code !== 'en' && code !== 'fi') return;
    locale.current = code;
    try {
        localStorage.setItem('woof_locale', code);
    } catch { /* ignore */ }
}

/** Get the current locale value (non-reactive getter for use in plain JS). */
export function getLocale() {
    return locale.current;
}

/**
 * Translate a dot-notation key, with optional {param} interpolation.
 * Falls back to English, then to the key itself.
 *
 * @param {string} key - e.g. 'nav.home', 'time.minutesAgo'
 * @param {Record<string, string|number>} [params] - e.g. { count: 5 }
 * @returns {string}
 */
export function t(key, params) {
    // Read `locale.current` so Svelte tracks it as a reactive dependency
    const lang = locale.current;
    const parts = key.split('.');

    let value = resolve(translations[lang], parts);
    if (value === undefined) {
        // Fallback to English
        value = resolve(translations.en, parts);
    }
    if (value === undefined) {
        // Return key as last resort
        return key;
    }

    if (params) {
        return interpolate(value, params);
    }
    return value;
}

/**
 * Return the localised name from a data object.
 * Objects from the API have `name` (EN) and `nameFi` (FI).
 * Falls back to `name` if the Finnish name is missing.
 *
 * @param {{ name?: string, nameFi?: string }} item
 * @returns {string}
 */
export function localName(item) {
    if (!item) return '';
    // Read `locale.current` for reactivity
    if (locale.current === 'fi' && item.nameFi) return item.nameFi;
    return item.name || '';
}

// --- Internal helpers ---

function resolve(obj, parts) {
    let current = obj;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return undefined;
        current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
}

function interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
}
