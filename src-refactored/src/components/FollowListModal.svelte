<script>
    import { getFollowers, getFollowing, followDog, unfollowDog, getMyDogs } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { modals, closeFollowListModal as storeClose } from '../../js/modal-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let dogs = $state([]);
    let loading = $state(true);
    let followingSet = $state(new Set());
    let followInFlight = $state(new Set());

    // Populate list when modal opens
    $effect(() => {
        if (modals.followListModalOpen && modals.followListData) {
            loadList();
        }
    });

    async function loadList() {
        loading = true;
        dogs = [];
        followingSet = new Set();
        followInFlight = new Set();

        try {
            const { dogId, type } = modals.followListData;
            const list = type === 'followers'
                ? await getFollowers(dogId)
                : await getFollowing(dogId);
            dogs = list || [];

            // If authenticated, check which dogs in the list the user's dogs follow
            if (isAuthenticated() && dogs.length > 0) {
                // Get user's dogs to find follow relationships
                try {
                    const myDogs = await getMyDogs();
                    if (myDogs.length > 0) {
                        const myDogFollowing = await getFollowing(myDogs[0].id);
                        followingSet = new Set((myDogFollowing || []).map(d => d.id));
                    }
                } catch {
                    // Silently fail — follow buttons just won't show state
                }
            }
        } catch (e) {
            console.error('Failed to load follow list:', e);
            dogs = [];
        } finally {
            loading = false;
        }
    }

    function isOwnDog(dogId) {
        return store.userDogIds.includes(dogId);
    }

    async function handleFollowToggle(dog) {
        if (!isAuthenticated() || followInFlight.has(dog.id)) return;

        followInFlight = new Set([...followInFlight, dog.id]);
        try {
            if (followingSet.has(dog.id)) {
                await unfollowDog(dog.id);
                followingSet = new Set([...followingSet].filter(id => id !== dog.id));
            } else {
                await followDog(dog.id);
                followingSet = new Set([...followingSet, dog.id]);
            }
        } catch (e) {
            console.error('Follow toggle failed:', e);
        } finally {
            followInFlight = new Set([...followInFlight].filter(id => id !== dog.id));
        }
    }

    // Manage body scroll + modal history
    $effect(() => {
        if (modals.followListModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.followListModalOpen) return;
        storeClose();
    }

    function handleKey(e) {
        if (e.key === 'Escape') close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }

    let title = $derived(modals.followListData?.type === 'followers' ? t('profile.followers') : t('profile.following'));
</script>

<svelte:window onkeydown={handleKey} />

<div
    class="modal"
    style:display={modals.followListModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="follow-list-title"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="follow-list-title">{title}</h2>
            <button class="modal-close" aria-label={t('common.close')} onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            {#if loading}
                <div class="follow-list-loading"><i class="fas fa-spinner fa-spin"></i></div>
            {:else if dogs.length === 0}
                <div class="follow-list-empty">
                    <i class="fas fa-user-friends"></i>
                    <p>{modals.followListData?.type === 'followers' ? t('profile.noFollowers') : t('profile.noFollowing')}</p>
                </div>
            {:else}
                <ul class="follow-list">
                    {#each dogs as dog (dog.id)}
                        <li class="follow-list-item">
                            <a href="/dog/{dog.slug || dog.id}" data-link class="follow-list-link" onclick={close}>
                                <img
                                    src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                                    alt={dog.name}
                                    loading="lazy"
                                    class="follow-list-avatar"
                                    onerror={fallbackImg}
                                />
                                <div class="follow-list-info">
                                    <span class="follow-list-name">{dog.name}</span>
                                    {#if dog.breedName}
                                        <span class="follow-list-breed">{dog.breedName}</span>
                                    {/if}
                                </div>
                            </a>
                            {#if isAuthenticated() && !isOwnDog(dog.id)}
                                <button
                                    class="follow-list-btn"
                                    class:following={followingSet.has(dog.id)}
                                    disabled={followInFlight.has(dog.id)}
                                    onclick={() => handleFollowToggle(dog)}
                                >
                                    {#if followInFlight.has(dog.id)}
                                        <i class="fas fa-spinner fa-spin"></i>
                                    {:else if followingSet.has(dog.id)}
                                        {t('profile.followingBtn')}
                                    {:else}
                                        {t('profile.followBtn')}
                                    {/if}
                                </button>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>

<style>
.follow-list-loading {
    text-align: center;
    padding: 40px;
    color: var(--woof-color-neutral-400);
    font-size: 24px;
}

.follow-list-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--woof-color-neutral-400);
}

.follow-list-empty i {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
}

.follow-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.follow-list-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.follow-list-item:last-child {
    border-bottom: none;
}

.follow-list-link {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    text-decoration: none;
    color: inherit;
}

.follow-list-avatar {
    width: 44px;
    height: 44px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.follow-list-info {
    flex: 1;
    min-width: 0;
}

.follow-list-name {
    display: block;
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.follow-list-breed {
    display: block;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
}

.follow-list-btn {
    flex-shrink: 0;
    padding: 6px 16px;
    border-radius: var(--woof-btn-radius);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    border: 1px solid var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    transition: all var(--woof-duration-fast);
}

.follow-list-btn.following {
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-700);
    border-color: var(--woof-color-neutral-200);
}

.follow-list-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
