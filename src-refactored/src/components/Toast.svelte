<script>
    import { fly, fade } from 'svelte/transition';
    import { toasts } from '../../js/toast-store.svelte.js';
</script>

<div class="toast-container" aria-live="polite" aria-atomic="false">
    {#each toasts as toast (toast.id)}
        <div
            class="toast toast-{toast.type}"
            data-testid="toast"
            role="alert"
            in:fly={{ y: 12, duration: 200 }}
            out:fade={{ duration: 150 }}
        >
            {toast.message}
        </div>
    {/each}
</div>

<style>
.toast-container {
    position: fixed;
    bottom: calc(var(--woof-nav-height) + var(--woof-space-4));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-2);
    z-index: 9999;
    pointer-events: none;
    width: max-content;
    max-width: min(360px, calc(100vw - var(--woof-space-8)));
}

.toast {
    padding: var(--woof-space-3) var(--woof-space-5);
    border-radius: var(--woof-radius-xl);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    line-height: var(--woof-lh-callout);
    color: var(--woof-color-neutral-0);
    box-shadow: var(--woof-shadow-lg);
    text-align: center;
    overflow-wrap: break-word;
    max-width: 100%;
}

/* success — calm, dark pill; the message itself conveys success */
.toast-success { background: var(--woof-color-neutral-900); }

/* error — Woof Crimson: the brand's own attention colour, not generic red */
.toast-error   { background: var(--woof-color-brand-primary); box-shadow: var(--woof-shadow-brand); }

/* info — artisan slate; muted and informational */
.toast-info    { background: var(--woof-color-slate-dark); }
</style>
