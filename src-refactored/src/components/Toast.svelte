<script>
    import { fly, fade } from 'svelte/transition';
    import { toasts } from '../../js/toast-store.svelte.js';
</script>

<div class="toast-container" aria-live="polite" aria-atomic="false">
    {#each toasts as toast (toast.id)}
        <div
            class="toast toast-{toast.type}"
            role="alert"
            in:fly={{ y: 12, duration: 200 }}
            out:fade={{ duration: 150 }}
        >
            {toast.message}
        </div>
    {/each}
</div>
