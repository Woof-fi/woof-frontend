<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        activeTab = 'posts',
        onTabChange = null,
        showHealth = true,
    } = $props();
</script>

<div class="profile-tabs" role="tablist">
    <button
        class="tab-link"
        class:active={activeTab === 'posts'}
        role="tab"
        aria-selected={activeTab === 'posts'}
        onclick={() => onTabChange?.('posts')}
    >
        <i class="fas fa-table-cells"></i> {t('profile.posts')}
    </button>
    <button
        class="tab-link"
        class:active={activeTab === 'friends'}
        role="tab"
        aria-selected={activeTab === 'friends'}
        onclick={() => onTabChange?.('friends')}
    >
        <i class="fas fa-user-group"></i> {t('profile.friends')}
    </button>
    {#if showHealth}
        <button
            class="tab-link"
            class:active={activeTab === 'health'}
            role="tab"
            aria-selected={activeTab === 'health'}
            onclick={() => onTabChange?.('health')}
        >
            <i class="fas fa-heart-pulse"></i> {t('profile.health')}
        </button>
    {/if}
</div>

<style>
.profile-tabs {
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--woof-color-neutral-200);
    margin-bottom: 0;
    position: sticky;
    top: 0;
    background: var(--woof-surface-primary);
    z-index: 10;
}

.profile-tabs .tab-link {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 16px;
    background: transparent;
    border: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    position: relative;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s;
}

.profile-tabs .tab-link i {
    font-size: 14px;
}

.profile-tabs .tab-link.active {
    color: var(--woof-color-brand-primary);
}

.profile-tabs .tab-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: transparent;
    transition: background-color 0.2s;
}

.profile-tabs .tab-link.active::after {
    background-color: var(--woof-color-brand-primary);
}
</style>
