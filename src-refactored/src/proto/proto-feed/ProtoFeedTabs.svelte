<script>
    let { activeTab = 'following', ontabchange = null } = $props();

    const tabs = [
        { id: 'following', label: 'Following' },
        { id: 'all', label: 'All' },
    ];
</script>

<div class="feed-tabs">
    {#each tabs as tab}
        <button
            class="feed-tab"
            class:active={activeTab === tab.id}
            onclick={() => ontabchange?.(tab.id)}
        >
            {tab.label}
        </button>
    {/each}
</div>

<style>
.feed-tabs {
    display: flex;
    justify-content: center;
    max-width: 500px;
    margin: 0 auto;
    border-bottom: 1px solid var(--woof-color-neutral-200);
    position: sticky;
    top: 28px;
    background: var(--woof-surface-primary);
    z-index: 10;
}

.feed-tab {
    flex: 1;
    padding: 14px 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-500);
    cursor: pointer;
    transition: color var(--woof-duration-fast), border-color var(--woof-duration-fast);
    font-family: var(--woof-font-family);
}

.feed-tab:hover {
    color: var(--woof-color-neutral-700);
}

.feed-tab.active {
    color: var(--woof-color-brand-primary);
    border-bottom-color: var(--woof-color-brand-primary);
}
</style>
