<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        friends = [],
        loading = false,
        loadedOnce = false,
        emptyMessage = '',
    } = $props();

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }
</script>

{#if loading}
    <div class="friends-loading"><i class="fas fa-spinner fa-spin"></i></div>
{:else if friends.length === 0 && loadedOnce}
    <div class="woof-empty-state">
        <div class="woof-empty-state-icon">
            <i class="fas fa-user-group"></i>
        </div>
        <p>{emptyMessage || t('profile.noFollowers')}</p>
    </div>
{:else if friends.length > 0}
    <ul class="friend-list">
        {#each friends as friend (friend.id)}
            <li class="friend-item">
                <a href="/dog/{friend.slug || friend.id}" data-link class="friend-link">
                    <img
                        src={friend.profilePhoto || '/images/dog_profile_pic.jpg'}
                        alt={friend.name}
                        loading="lazy"
                        class="friend-avatar"
                        onerror={fallbackImg}
                    />
                    <div class="friend-info">
                        <span class="friend-name">{friend.name}</span>
                        <span class="friend-breed">{friend.breedName}</span>
                    </div>
                </a>
            </li>
        {/each}
    </ul>
{/if}

<style>
.friends-loading {
    text-align: center;
    padding: var(--woof-space-8);
    color: var(--woof-color-neutral-500);
}

.friend-list {
    list-style-type: none;
    padding: 8px 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.friend-item {
    list-style: none;
}

.friend-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s;
}

.friend-link:hover {
    background-color: var(--woof-color-neutral-100, rgba(0, 0, 0, 0.03));
}

.friend-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.friend-info {
    flex: 1;
    min-width: 0;
}

.friend-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--woof-color-neutral-900);
}

.friend-breed {
    display: block;
    font-size: 13px;
    color: var(--woof-color-neutral-500);
}
</style>
