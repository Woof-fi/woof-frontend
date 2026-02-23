<script>
    import { toasts } from '../../js/toast-store.svelte.js';
</script>

<div class="toast-container">
    {#each toasts as toast (toast.id)}
        <div class="toast toast-{toast.type}" role="alert">{toast.message}</div>
    {/each}
</div>
