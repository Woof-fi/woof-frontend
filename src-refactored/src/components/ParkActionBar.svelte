<script>
    import { t } from '../../js/i18n-store.svelte.js';
    import { checkInAtPark, checkOutFromPark } from '../../js/api.js';
    import { showToast } from '../../js/utils.js';
    import { store } from '../../js/svelte-store.svelte.js';

    let {
        parkId = '',
        myDogs = [],
        activeCheckins = [],
        isFollowing = false,
        followLoading = false,
        onFollowToggle = null,
        onCheckin = null,
        onCheckout = null,
    } = $props();

    let submitting = $state(false);
    let showCheckinForm = $state(false);
    let selectedDogId = $state('');
    let note = $state('');
    let duration = $state(30);
    let authed = $derived(store.authUser !== null);

    const DURATIONS = [
        { value: 30, label: '30min' },
        { value: 60, label: '1h' },
        { value: 90, label: '1h 30min' },
        { value: 120, label: '2h' },
    ];

    let myCheckin = $derived(() => {
        if (!authed || myDogs.length === 0) return null;
        const myDogIds = new Set(myDogs.map(d => d.id));
        return activeCheckins.find(c => myDogIds.has(c.dogId || c.dog_id || c.dog?.id));
    });

    let isCheckedIn = $derived(myCheckin() != null);

    async function handleCheckIn() {
        const dogId = selectedDogId || myDogs[0]?.id;
        if (!dogId) return;
        submitting = true;
        try {
            await checkInAtPark(parkId, { dogId, note: note.trim() || undefined, plannedDurationMinutes: duration });
            showToast(t('dogPark.checkedIn'), 'success');
            showCheckinForm = false;
            note = '';
            selectedDogId = '';
            onCheckin?.();
        } catch (e) {
            const msg = e?.data?.error || t('dogPark.checkInFailed');
            showToast(msg, 'error');
        }
        submitting = false;
    }

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

    function handleCheckinClick() {
        showCheckinForm = !showCheckinForm;
        if (showCheckinForm && myDogs.length === 1) {
            selectedDogId = myDogs[0].id;
        }
    }
</script>

{#if authed && myDogs.length > 0}
    <div class="park-action-sticky">
        {#if showCheckinForm}
            <div class="checkin-panel">
                {#if myDogs.length === 1}
                    <div class="checkin-single-dog">
                        <img
                            src={myDogs[0].profilePhoto || '/images/dog_profile_pic.jpg'}
                            alt={myDogs[0].name}
                            class="checkin-dog-photo"
                            onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                        />
                        <span class="checkin-single-dog-name">{myDogs[0].name}</span>
                    </div>
                {:else}
                    <p class="checkin-panel-label">{t('dogPark.selectDogToCheckIn')}</p>
                    <div class="checkin-dog-list">
                        {#each myDogs as dog (dog.id)}
                            <button
                                class="checkin-dog-option"
                                class:checkin-dog-option--selected={selectedDogId === dog.id}
                                onclick={() => { selectedDogId = dog.id; }}
                            >
                                <img
                                    src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                                    alt={dog.name}
                                    class="checkin-dog-photo"
                                    onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                                />
                                <span>{dog.name}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
                <div class="checkin-duration-section">
                    <p class="checkin-panel-label">{t('dogPark.howLong')}</p>
                    <div class="checkin-duration-row">
                        {#each DURATIONS as d (d.value)}
                            <button
                                class="duration-chip"
                                class:duration-chip--selected={duration === d.value}
                                onclick={() => { duration = d.value; }}
                            >
                                {d.label}
                            </button>
                        {/each}
                    </div>
                </div>
                <input
                    type="text"
                    class="checkin-note-input"
                    placeholder={t('dogPark.checkinNote')}
                    bind:value={note}
                    maxlength="500"
                    onkeydown={(e) => { if (e.key === 'Enter') handleCheckIn(); }}
                />
                <button
                    class="checkin-confirm-btn"
                    onclick={handleCheckIn}
                    disabled={submitting || (myDogs.length > 1 && !selectedDogId)}
                >
                    {#if submitting}
                        <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.confirmCheckIn')}</span>
                    {:else}
                        <span class="btn-content"><i class="fas fa-paw"></i> {t('dogPark.confirmCheckIn')}</span>
                    {/if}
                </button>
            </div>
        {/if}
        <div class="park-action-buttons">
            {#if isCheckedIn}
                <button
                    class="park-action-btn park-action-btn--checkout"
                    onclick={handleCheckOut}
                    disabled={submitting}
                >
                    {#if submitting}
                        <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.checkOut')}</span>
                    {:else}
                        <span class="btn-content"><i class="fas fa-right-from-bracket"></i> {t('dogPark.checkOut')}</span>
                    {/if}
                </button>
            {:else}
                <button
                    class="park-action-btn park-action-btn--checkin"
                    onclick={handleCheckinClick}
                    disabled={submitting}
                >
                    {#if submitting}
                        <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.checkIn')}</span>
                    {:else}
                        <span class="btn-content"><i class="fas fa-paw"></i> {t('dogPark.checkIn')}</span>
                    {/if}
                </button>
            {/if}
            <button
                class="park-action-btn park-action-btn--follow"
                class:following={isFollowing}
                onclick={onFollowToggle}
                disabled={followLoading}
            >
                {#if followLoading}
                    <span class="btn-content"><span class="woof-spinner"></span></span>
                {:else if isFollowing}
                    <span class="btn-content"><i class="fas fa-heart"></i> {t('dogPark.followingPark')}</span>
                {:else}
                    <span class="btn-content"><i class="far fa-heart"></i> {t('dogPark.follow')}</span>
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

/* Wrapper to prevent FA dom.watch() SVG orphans in conditional blocks */
.btn-content {
    display: contents;
}

.park-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Check-in form panel */
.checkin-panel {
    max-width: 640px;
    margin: 0 auto var(--woof-space-2);
    background: var(--woof-surface-primary);
    border-radius: var(--woof-radius-lg);
    box-shadow: var(--woof-shadow-lg);
    padding: var(--woof-space-3);
    pointer-events: all;
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.checkin-panel-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.checkin-dog-list {
    display: flex;
    gap: var(--woof-space-2);
    flex-wrap: wrap;
}

.checkin-dog-option {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 2px solid var(--woof-color-neutral-200);
    background: none;
    border-radius: var(--woof-radius-md);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-900);
    transition: all var(--woof-duration-fast);
}

.checkin-dog-option:hover {
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-subtle);
}

.checkin-dog-option--selected {
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-subtle);
}

.checkin-dog-photo {
    width: 32px;
    height: 32px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
}

.checkin-single-dog {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
}

.checkin-single-dog-name {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.checkin-duration-section {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
}

.checkin-duration-row {
    display: flex;
    gap: var(--woof-space-1);
}

.duration-chip {
    padding: var(--woof-space-2) var(--woof-space-3);
    min-width: 48px;
    border: 1.5px solid var(--woof-color-neutral-200);
    background: none;
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    font-family: inherit;
    color: var(--woof-color-neutral-600);
    cursor: pointer;
    transition: all var(--woof-duration-fast);
    white-space: nowrap;
    text-align: center;
}

.duration-chip:hover {
    border-color: var(--woof-color-brand-primary);
    color: var(--woof-color-brand-primary);
}

.duration-chip--selected {
    background: var(--woof-color-brand-primary);
    border-color: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
}

.duration-chip--selected:hover {
    background: var(--woof-color-brand-primary-dark);
    border-color: var(--woof-color-brand-primary-dark);
}

.checkin-note-input {
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: inherit;
    color: var(--woof-color-neutral-900);
    background: var(--woof-surface-primary);
    transition: border-color var(--woof-duration-fast);
    box-sizing: border-box;
}

.checkin-note-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
}

.checkin-note-input::placeholder {
    color: var(--woof-color-neutral-400);
}

.checkin-confirm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
    transition: background var(--woof-duration-fast);
}

.checkin-confirm-btn:hover {
    background: var(--woof-color-brand-primary-dark);
}

.checkin-confirm-btn:disabled {
    opacity: 0.6;
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
