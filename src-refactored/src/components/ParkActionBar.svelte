<script>
    import { t } from '../../js/i18n-store.svelte.js';
    import { checkOutFromPark } from '../../js/api.js';
    import { showToast } from '../../js/utils.js';
    import { store } from '../../js/svelte-store.svelte.js';

    let {
        myDogs = [],
        activeCheckins = [],
        isFollowing = false,
        followLoading = false,
        onFollowToggle = null,
        onCheckinClick = null,
        onCheckout = null,
    } = $props();

    let submitting = $state(false);
    let authed = $derived(store.authUser !== null);

    // Find if any of the user's dogs are already checked in
    let myCheckin = $derived(() => {
        if (!authed || myDogs.length === 0) return null;
        const myDogIds = new Set(myDogs.map(d => d.id));
        return activeCheckins.find(c => myDogIds.has(c.dogId || c.dog_id || c.dog?.id));
    });

    let isCheckedIn = $derived(myCheckin() != null);

    async function handleCheckOut() {
        const checkin = myCheckin();
        if (!checkin) return;
        submitting = true;
        try {
            await checkOutFromPark(checkin.id);
            showToast(t('dogPark.checkedOut'), 'success');
            onCheckout?.();
        } catch (e) {
            showToast(t('common.error'), 'error');
        }
        submitting = false;
    }
</script>

{#if authed && myDogs.length > 0}
    <div class="park-action-sticky">
        <div class="park-action-buttons">
            {#if isCheckedIn}
                <button
                    class="park-action-btn park-action-btn--checkout"
                    onclick={handleCheckOut}
                    disabled={submitting}
                >
                    {#if submitting}
                        <i class="fas fa-spinner fa-spin"></i>
                    {:else}
                        <i class="fas fa-right-from-bracket"></i>
                    {/if}
                    {t('dogPark.checkOut')}
                </button>
            {:else}
                <button
                    class="park-action-btn park-action-btn--checkin"
                    onclick={() => onCheckinClick?.()}
                >
                    <i class="fas fa-paw"></i>
                    {t('dogPark.checkIn')}
                </button>
            {/if}
            <button
                class="park-action-btn park-action-btn--follow"
                class:following={isFollowing}
                onclick={onFollowToggle}
                disabled={followLoading}
            >
                {#if followLoading}
                    <i class="fas fa-spinner fa-spin"></i>
                {:else if isFollowing}
                    <i class="fas fa-heart"></i> {t('dogPark.followingPark')}
                {:else}
                    <i class="far fa-heart"></i> {t('dogPark.follow')}
                {/if}
            </button>
        </div>
    </div>
{/if}

<style>
.park-action-sticky {
    position: fixed;
    bottom: 0;
    left: 280px;
    right: 0;
    padding: 12px 20px 16px 20px;
    background: linear-gradient(to top, rgba(255,255,255,1) 55%, rgba(255,255,255,0));
    z-index: 50;
    pointer-events: none;
}

.park-action-buttons {
    display: flex;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto;
    pointer-events: all;
}

.park-action-btn {
    flex: 1;
    height: var(--woof-btn-height-lg);
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    border-radius: var(--woof-btn-radius);
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
    transition: all var(--woof-duration-fast);
}

.park-action-btn--checkin {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
}

.park-action-btn--checkin:hover {
    background: var(--woof-color-brand-primary-dark);
}

.park-action-btn--checkout {
    background: var(--woof-surface-primary);
    color: var(--woof-color-brand-primary);
    border: 2px solid var(--woof-color-brand-primary);
}

.park-action-btn--checkout:hover {
    background: var(--woof-color-brand-primary-subtle);
}

.park-action-btn--follow {
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-900);
    border: 1px solid var(--woof-color-neutral-200);
}

.park-action-btn--follow:hover {
    background: var(--woof-color-neutral-100);
}

.park-action-btn--follow.following {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border-color: var(--woof-color-brand-primary);
}

.park-action-btn--follow.following:hover {
    background: var(--woof-color-brand-primary-dark);
}

.park-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .park-action-sticky {
        left: 0;
        bottom: 56px;
        padding: 12px 20px 12px 20px;
    }
}
</style>
