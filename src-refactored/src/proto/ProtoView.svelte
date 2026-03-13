<script>
    import ProtoHub from './proto-hub/ProtoHub.svelte';
    import ProtoEmails from './proto-emails/ProtoEmails.svelte';
    import ProtoSEO from './proto-seo/ProtoSEO.svelte';
    import ProtoFeedback from './proto-feedback/ProtoFeedback.svelte';
    import { store } from '../../js/svelte-store.svelte.js';

    let { params = {} } = $props();
    let view = $derived(params.name || 'hub');
    let isAdmin = $derived(store.authUser?.role === 'admin');
</script>

{#if isAdmin}
    <div class="proto-banner">
        <i class="fas fa-flask"></i> PROTOTYPE
        <a href="/proto" data-link class="proto-banner-link">All prototypes</a>
    </div>

    <main class="proto-wrapper">
        {#if view === 'emails'}
            <ProtoEmails />
        {:else if view === 'seo'}
            <ProtoSEO />
        {:else if view === 'feedback'}
            <ProtoFeedback />
        {:else}
            <ProtoHub />
        {/if}
    </main>
{:else}
    <div class="access-denied">
        <i class="fas fa-lock"></i>
        <p>Access denied</p>
    </div>
{/if}

<style>
.proto-banner {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    text-align: center;
    padding: var(--woof-space-2) var(--woof-space-4);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-bold);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
}

.proto-banner-link {
    color: var(--woof-color-neutral-0);
    opacity: 0.8;
    font-size: var(--woof-text-caption-2);
    text-decoration: underline;
    letter-spacing: 0;
    text-transform: none;
    margin-left: var(--woof-space-3);
}

.proto-wrapper {
    max-width: 640px;
    margin: 0 auto;
    padding: var(--woof-space-4);
    padding-bottom: 100px;
}

.access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: var(--woof-color-neutral-400);
    gap: var(--woof-space-3);
}

.access-denied i {
    font-size: 48px;
}

.access-denied p {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-medium);
    margin: 0;
}
</style>
