<script>
    import PostCard from '../../components/PostCard.svelte';
    import CreateActionSheet from './CreateActionSheet.svelte';
    import { MOCK_POSTS } from '../mock-data.js';

    let sheetOpen = $state(false);

    const posts = MOCK_POSTS.slice(0, 4);

    function openSheet() {
        sheetOpen = true;
    }

    function closeSheet() {
        sheetOpen = false;
    }
</script>

<div class="proto-create-page">
    <div class="page-header">
        <h1 class="page-title">Unified Create Button</h1>
        <p class="page-subtitle">Tap the <strong>+</strong> button to create posts, schedule visits, or log health records.</p>
    </div>

    <div class="feed">
        {#each posts as post (post.id)}
            <PostCard {...post} isOwnPost={false} />
        {/each}
    </div>
</div>

<!-- FAB -->
<button
    class="fab"
    aria-label="Create new content"
    onclick={openSheet}
>
    <i class="fas fa-plus"></i>
</button>

<!-- Action Sheet -->
{#if sheetOpen}
    <CreateActionSheet onclose={closeSheet} />
{/if}

<style>
.proto-create-page {
    padding-bottom: var(--woof-space-16);
}

.page-header {
    text-align: center;
    margin-bottom: var(--woof-space-6);
}

.page-title {
    margin: 0 0 var(--woof-space-2);
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
}

.page-subtitle {
    margin: 0;
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    line-height: var(--woof-lh-callout);
}

.feed {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-4);
}

.fab {
    position: fixed;
    bottom: 84px;
    right: 20px;
    z-index: 50;
    width: 56px;
    height: 56px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--woof-text-title-2);
    box-shadow: var(--woof-shadow-brand);
    transition: transform var(--woof-duration-fast) var(--woof-ease-bounce),
                background var(--woof-duration-fast);
}

.fab:hover {
    background: var(--woof-color-brand-primary-dark);
    transform: scale(1.08);
}

.fab:active {
    transform: scale(0.95);
}
</style>
