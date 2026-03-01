<script>
    import { t } from '../../js/i18n-store.svelte.js';

    /** @type {import('svelte').Snippet} */
    let { children } = $props();

    // SHA-256 hex of the correct password — computed once at build time, hardcoded here
    const EXPECTED_HASH = 'a42e46a1ad8d82906b0f488f2548d9f6bcb26a54c102b54d1d19ab9297afb5c3';
    const COOKIE_NAME = 'woof_access';
    const COOKIE_MAX_AGE = 7776000; // 90 days in seconds

    // Skip gate on localhost (dev, unit tests, E2E) — only enforce on production
    const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let unlocked = $state(isLocal);
    let password = $state('');
    let error = $state('');
    let shaking = $state(false);

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function setCookie(name, value, maxAge) {
        document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
    }

    async function sha256(text) {
        const data = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Check cookie on mount
    $effect(() => {
        const stored = getCookie(COOKIE_NAME);
        if (stored === EXPECTED_HASH) {
            unlocked = true;
        }
    });

    async function handleSubmit(e) {
        e.preventDefault();
        error = '';
        const hash = await sha256(password);
        if (hash === EXPECTED_HASH) {
            setCookie(COOKIE_NAME, hash, COOKIE_MAX_AGE);
            unlocked = true;
        } else {
            error = t('gate.wrongPassword');
            shaking = true;
            setTimeout(() => { shaking = false; }, 500);
        }
    }
</script>

{#if unlocked}
    {@render children()}
{:else}
    <div class="gate-backdrop">
        <form class="gate-card" class:shake={shaking} onsubmit={handleSubmit}>
            <div class="gate-brand">
                <i class="fas fa-paw gate-icon"></i>
                <h1 class="gate-title">{t('gate.title')}</h1>
            </div>
            <p class="gate-subtitle">{t('gate.subtitle')}</p>

            <div class="gate-field">
                <input
                    type="password"
                    bind:value={password}
                    placeholder={t('gate.placeholder')}
                    class="gate-input"
                    autocomplete="off"
                />
            </div>

            {#if error}
                <p class="gate-error">{error}</p>
            {/if}

            <button type="submit" class="gate-btn">{t('gate.enter')}</button>
        </form>
    </div>
{/if}

<style>
    .gate-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--woof-color-neutral-50, #FAFAF8);
        font-family: var(--woof-font-family);
    }

    .gate-card {
        width: 100%;
        max-width: 360px;
        margin: 0 var(--woof-spacing-md, 16px);
        padding: var(--woof-spacing-xl, 32px);
        background: var(--woof-surface-primary, #FFFFFF);
        border-radius: var(--woof-radius-xl, 16px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        text-align: center;
    }

    .gate-brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: var(--woof-spacing-xs, 8px);
    }

    .gate-icon {
        font-size: 28px;
        color: var(--woof-color-brand-primary, #C9403F);
    }

    .gate-title {
        font-size: var(--woof-text-title-1, 28px);
        font-weight: 800;
        color: var(--woof-color-neutral-900, #1A1A1A);
        margin: 0;
    }

    .gate-subtitle {
        font-size: var(--woof-text-callout, 15px);
        color: var(--woof-color-neutral-500, #737373);
        margin: 0 0 var(--woof-spacing-lg, 24px);
    }

    .gate-field {
        margin-bottom: var(--woof-spacing-md, 16px);
    }

    .gate-input {
        width: 100%;
        padding: 12px 16px;
        font-size: var(--woof-text-body, 16px);
        font-family: var(--woof-font-family);
        border: 1.5px solid var(--woof-color-neutral-200, #EBEBEB);
        border-radius: var(--woof-radius-md, 8px);
        outline: none;
        transition: border-color 0.15s;
        box-sizing: border-box;
    }

    .gate-input:focus {
        border-color: var(--woof-color-brand-primary, #C9403F);
    }

    .gate-error {
        font-size: var(--woof-text-footnote, 13px);
        color: var(--woof-color-error, #FF3B30);
        margin: 0 0 var(--woof-spacing-sm, 12px);
    }

    .gate-btn {
        width: 100%;
        padding: 12px;
        font-size: var(--woof-text-body, 16px);
        font-weight: 600;
        font-family: var(--woof-font-family);
        color: #FFFFFF;
        background: var(--woof-color-brand-primary, #C9403F);
        border: none;
        border-radius: var(--woof-radius-md, 8px);
        cursor: pointer;
        transition: background 0.15s;
    }

    .gate-btn:hover {
        background: var(--woof-color-brand-primary-dark, #A83030);
    }

    .shake {
        animation: shake 0.4s ease-in-out;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
    }
</style>
