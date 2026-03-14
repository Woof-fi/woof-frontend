<script>
    import { followDog, unfollowDog, getMyDogs, getFollowing } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import { focusTrap } from '../actions/focus-trap.ts';

    /** @type {{ isOpen: boolean, title: string, ariaId: string, emptyIcon: string, emptyText: string, fetchDogs: () => Promise<Array<{id: string, slug?: string, name: string, profilePhoto?: string, breedName?: string}>>, onclose: () => void }} */
    let { isOpen, title, ariaId, emptyIcon, emptyText, fetchDogs, onclose } = $props();

    let dogs = $state([]);
    let loading = $state(true);
    let followingSet = $state(new Set());
    let followInFlight = $state(new Set());

    // Load data + manage scroll/history when modal opens
    $effect(() => {
        if (isOpen) {
            loadList();
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    async function loadList() {
        loading = true;
        dogs = [];
        followingSet = new Set();
        followInFlight = new Set();

        try {
            const list = await fetchDogs();
            dogs = list || [];

            // If authenticated, check which dogs in the list the user's dogs follow
            if (isAuthenticated() && dogs.length > 0) {
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
            console.error('Failed to load dog list:', e);
            showToast(t('common.failedLoad'), 'error');
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
            const activeDogId = store.currentDog?.id;
            if (followingSet.has(dog.id)) {
                await unfollowDog(dog.id, activeDogId);
                followingSet = new Set([...followingSet].filter(id => id !== dog.id));
            } else {
                await followDog(dog.id, activeDogId);
                followingSet = new Set([...followingSet, dog.id]);
            }
        } catch (e) {
            console.error('Follow toggle failed:', e);
            showToast(t('common.error'), 'error');
        } finally {
            followInFlight = new Set([...followInFlight].filter(id => id !== dog.id));
        }
    }

    function handleKey(e) {
        if (e.key === 'Escape') onclose();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) onclose();
    }

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    class="modal"
    style:display={isOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby={ariaId}
>
    <div class="modal-content" use:focusTrap>
        <div class="modal-header">
            <button class="modal-close" aria-label={t('common.close')} onclick={onclose}>&times;</button>
            <h2 id={ariaId}>{title}</h2>
            <span class="modal-header-spacer"></span>
        </div>
        <div class="modal-body">
            {#if loading}
                <div class="dog-list-loading"><i class="fas fa-spinner fa-spin"></i></div>
            {:else if dogs.length === 0}
                <div class="dog-list-empty">
                    <i class={emptyIcon}></i>
                    <p>{emptyText}</p>
                </div>
            {:else}
                <ul class="dog-list">
                    {#each dogs as dog (dog.id)}
                        <li class="dog-list-item">
                            <a href="/dog/{dog.slug || dog.id}" data-link class="dog-list-link" onclick={onclose}>
                                <img
                                    src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                                    alt={dog.name}
                                    loading="lazy"
                                    class="dog-list-avatar"
                                    onerror={fallbackImg}
                                />
                                <div class="dog-list-info">
                                    <span class="dog-list-name">{dog.name}</span>
                                    {#if dog.breedName}
                                        <span class="dog-list-breed">{dog.breedName}</span>
                                    {/if}
                                </div>
                            </a>
                            {#if isAuthenticated() && !isOwnDog(dog.id)}
                                <button
                                    class="dog-list-btn"
                                    class:following={followingSet.has(dog.id)}
                                    disabled={followInFlight.has(dog.id)}
                                    onclick={() => handleFollowToggle(dog)}
                                >
                                    {#if followInFlight.has(dog.id)}
                                        <span class="woof-spinner"></span>
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
.modal-header {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-5);
}

.modal-header h2 {
    flex: 1;
    text-align: center;
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
}

.modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    border: none;
    background: none;
    color: var(--woof-color-neutral-700);
    font-size: var(--woof-text-title-2);
    cursor: pointer;
    border-radius: var(--woof-radius-full);
    transition: background var(--woof-duration-fast);
    flex-shrink: 0;
}

.modal-close:hover {
    background: var(--woof-color-neutral-100);
}

.modal-header-spacer {
    width: var(--woof-touch-target);
    flex-shrink: 0;
}

.dog-list-loading {
    text-align: center;
    padding: var(--woof-space-8);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-title-2);
}

.dog-list-empty {
    text-align: center;
    padding: var(--woof-space-8) var(--woof-space-5);
    color: var(--woof-color-neutral-400);
}

.dog-list-empty i {
    font-size: var(--woof-text-display);
    margin-bottom: var(--woof-space-3);
    display: block;
}

.dog-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.dog-list-item {
    display: flex;
    align-items: center;
    padding: var(--woof-space-3) 0;
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.dog-list-item:last-child {
    border-bottom: none;
}

.dog-list-link {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    flex: 1;
    min-width: 0;
    text-decoration: none;
    color: inherit;
}

.dog-list-avatar {
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.dog-list-info {
    flex: 1;
    min-width: 0;
}

.dog-list-name {
    display: block;
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dog-list-breed {
    display: block;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
}

.dog-list-btn {
    flex-shrink: 0;
    padding: var(--woof-space-1) var(--woof-space-4);
    border-radius: var(--woof-btn-radius);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    border: 1px solid var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    transition: all var(--woof-duration-fast);
}

.dog-list-btn.following {
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-700);
    border-color: var(--woof-color-neutral-200);
}

.dog-list-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
