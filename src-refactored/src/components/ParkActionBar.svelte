<script>
    import { t } from '../../js/i18n-store.svelte.js';
    import { checkInAtPark, checkOutFromPark, scheduleParkVisit } from '../../js/api.js';
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
        onVisitScheduled = null,
        requestScheduleOpen = false,
        onScheduleHandled = null,
    } = $props();

    let submitting = $state(false);
    let showCheckinForm = $state(false);
    let selectedDogIds = $state(new Set());
    let note = $state('');
    let duration = $state(30);
    let checkinMode = $state('now');
    let visitTime = $state('');
    let authed = $derived(store.authUser !== null);

    const DURATIONS = [
        { value: 30, label: '30min' },
        { value: 60, label: '1h' },
        { value: 90, label: '1h 30min' },
        { value: 120, label: '2h' },
    ];

    // Find ALL of the user's dogs that are currently checked in
    let myCheckins = $derived.by(() => {
        if (!authed || myDogs.length === 0) return [];
        const myDogIds = new Set(myDogs.map(d => d.id));
        return activeCheckins.filter(c => myDogIds.has(c.dogId || c.dog_id || c.dog?.id));
    });

    let checkedInCount = $derived(myCheckins.length);
    let isCheckedIn = $derived(checkedInCount > 0);
    let selectedCount = $derived(selectedDogIds.size);

    function getDefaultScheduleTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    }

    function toggleDog(dogId) {
        const next = new Set(selectedDogIds);
        if (next.has(dogId)) {
            next.delete(dogId);
        } else {
            next.add(dogId);
        }
        selectedDogIds = next;
    }

    async function handleCheckIn() {
        const ids = myDogs.length === 1 ? [myDogs[0].id] : [...selectedDogIds];
        if (ids.length === 0) return;
        submitting = true;
        try {
            await Promise.all(ids.map(dogId =>
                checkInAtPark(parkId, { dogId, note: note.trim() || undefined, plannedDurationMinutes: duration })
            ));
            showToast(t('dogPark.checkedIn'), 'success');
            showCheckinForm = false;
            note = '';
            selectedDogIds = new Set();
            onCheckin?.();
        } catch (e) {
            const msg = e?.data?.error || t('dogPark.checkInFailed');
            showToast(msg, 'error');
        }
        submitting = false;
    }

    async function handleScheduleVisit() {
        const ids = myDogs.length === 1 ? [myDogs[0].id] : [...selectedDogIds];
        if (ids.length === 0 || !visitTime) return;
        submitting = true;
        try {
            const arrivalDate = new Date(visitTime);
            await Promise.all(ids.map(dogId =>
                scheduleParkVisit(parkId, {
                    dogId,
                    arrivalAt: arrivalDate.toISOString(),
                    durationMinutes: duration,
                    note: note.trim() || undefined,
                })
            ));
            showToast(t('dogPark.visitScheduled'), 'success');
            showCheckinForm = false;
            note = '';
            selectedDogIds = new Set();
            visitTime = '';
            onVisitScheduled?.();
        } catch (e) {
            const msg = e?.data?.error || t('common.error');
            showToast(msg, 'error');
        }
        submitting = false;
    }

    async function handleCheckOut() {
        const checkins = myCheckins;
        if (checkins.length === 0) return;
        submitting = true;
        try {
            await Promise.all(checkins.map(c => checkOutFromPark(c.id)));
            showToast(t('dogPark.checkedOut'), 'success');
            onCheckout?.();
        } catch (e) {
            showToast(t('common.error'), 'error');
        }
        submitting = false;
    }

    function handleCheckinClick() {
        showCheckinForm = !showCheckinForm;
        if (showCheckinForm) {
            checkinMode = 'now';
            if (myDogs.length === 1) {
                selectedDogIds = new Set([myDogs[0].id]);
            } else {
                const currentId = store.currentDog?.id;
                selectedDogIds = currentId ? new Set([currentId]) : new Set();
            }
        }
    }

    function handleConfirmAction() {
        if (checkinMode === 'schedule') {
            handleScheduleVisit();
        } else {
            handleCheckIn();
        }
    }

    // Parent can request opening in schedule mode
    $effect(() => {
        if (requestScheduleOpen) {
            showCheckinForm = true;
            checkinMode = 'schedule';
            visitTime = getDefaultScheduleTime();
            if (myDogs.length === 1) {
                selectedDogIds = new Set([myDogs[0].id]);
            } else {
                const currentId = store.currentDog?.id;
                selectedDogIds = currentId ? new Set([currentId]) : new Set();
            }
            onScheduleHandled?.();
        }
    });

    // Click-outside + Escape to close checkin form
    $effect(() => {
        if (!showCheckinForm) return;

        function handleClick(e) {
            const sticky = document.querySelector('.park-action-sticky');
            if (sticky && !sticky.contains(e.target)) {
                showCheckinForm = false;
            }
        }

        function handleKey(e) {
            if (e.key === 'Escape') {
                showCheckinForm = false;
            }
        }

        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('keydown', handleKey);
        };
    });
</script>

{#if authed && myDogs.length > 0}
    <div class="park-action-sticky">
        {#if showCheckinForm}
            <div class="checkin-panel">
                <div class="checkin-panel-handle"></div>

                <div class="checkin-mode-toggle">
                    <button
                        class="mode-pill"
                        class:mode-pill--active={checkinMode === 'now'}
                        onclick={() => { checkinMode = 'now'; }}
                    >
                        <i class="fas fa-paw"></i>
                        {t('dogPark.now')}
                    </button>
                    <button
                        class="mode-pill"
                        class:mode-pill--active={checkinMode === 'schedule'}
                        onclick={() => { checkinMode = 'schedule'; visitTime = visitTime || getDefaultScheduleTime(); }}
                    >
                        <i class="fas fa-calendar-plus"></i>
                        {t('dogPark.later')}
                    </button>
                </div>

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
                    <div class="checkin-section">
                        <p class="checkin-section-label">{t('dogPark.selectDogToCheckIn')}</p>
                        <div class="checkin-dog-list">
                            {#each myDogs as dog (dog.id)}
                                <button
                                    class="checkin-dog-option"
                                    class:checkin-dog-option--selected={selectedDogIds.has(dog.id)}
                                    onclick={() => toggleDog(dog.id)}
                                >
                                    <span class="checkin-checkbox" class:checkin-checkbox--checked={selectedDogIds.has(dog.id)}>
                                        {#if selectedDogIds.has(dog.id)}
                                            <i class="fas fa-check"></i>
                                        {/if}
                                    </span>
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
                    </div>
                {/if}

                {#if checkinMode === 'schedule'}
                    <div class="checkin-section">
                        <p class="checkin-section-label">{t('dogPark.arrivalTime')}</p>
                        <input
                            type="datetime-local"
                            class="checkin-time-input"
                            bind:value={visitTime}
                        />
                    </div>
                {/if}

                <div class="checkin-section">
                    <p class="checkin-section-label">{t('dogPark.howLong')}</p>
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
                    onkeydown={(e) => { if (e.key === 'Enter') handleConfirmAction(); }}
                />

                {#if checkinMode === 'now'}
                    <button
                        class="checkin-confirm-btn"
                        onclick={handleCheckIn}
                        disabled={submitting || (myDogs.length > 1 && selectedCount === 0)}
                    >
                        {#key submitting}
                            {#if submitting}
                                <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.confirmCheckIn')}</span>
                            {:else}
                                <span class="btn-content">
                                    <i class="fas fa-paw"></i>
                                    {#if myDogs.length > 1 && selectedCount > 1}
                                        {t('dogPark.checkInCount', { count: selectedCount })}
                                    {:else}
                                        {t('dogPark.confirmCheckIn')}
                                    {/if}
                                </span>
                            {/if}
                        {/key}
                    </button>
                {:else}
                    <button
                        class="checkin-confirm-btn checkin-confirm-btn--schedule"
                        onclick={handleScheduleVisit}
                        disabled={submitting || (myDogs.length > 1 && selectedCount === 0) || !visitTime}
                    >
                        {#key submitting}
                            {#if submitting}
                                <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.scheduleVisit')}</span>
                            {:else}
                                <span class="btn-content">
                                    <i class="fas fa-calendar-plus"></i>
                                    {t('dogPark.scheduleVisit')}
                                </span>
                            {/if}
                        {/key}
                    </button>
                {/if}
            </div>
        {/if}
        <div class="park-action-buttons">
            {#if isCheckedIn}
                <button
                    class="park-action-btn park-action-btn--checkout"
                    onclick={handleCheckOut}
                    disabled={submitting}
                >
                    {#key submitting}
                        {#if submitting}
                            <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.checkOut')}</span>
                        {:else}
                            <span class="btn-content">
                                <i class="fas fa-right-from-bracket"></i>
                                {#if checkedInCount > 1}
                                    {t('dogPark.checkOutCount', { count: checkedInCount })}
                                {:else}
                                    {t('dogPark.checkOut')}
                                {/if}
                            </span>
                        {/if}
                    {/key}
                </button>
            {:else}
                <button
                    class="park-action-btn park-action-btn--checkin"
                    onclick={handleCheckinClick}
                    disabled={submitting}
                >
                    {#key submitting}
                        {#if submitting}
                            <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.checkIn')}</span>
                        {:else}
                            <span class="btn-content"><i class="fas fa-paw"></i> {t('dogPark.checkIn')}</span>
                        {/if}
                    {/key}
                </button>
            {/if}
            <button
                class="park-action-btn park-action-btn--follow"
                class:following={isFollowing}
                onclick={onFollowToggle}
                disabled={followLoading}
            >
                {#key followLoading}
                    {#if followLoading}
                        <span class="btn-content"><span class="woof-spinner"></span></span>
                    {:else if isFollowing}
                        <span class="btn-content"><i class="fas fa-heart"></i> {t('dogPark.followingPark')}</span>
                    {:else}
                        <span class="btn-content"><i class="far fa-heart"></i> {t('dogPark.follow')}</span>
                    {/if}
                {/key}
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
    border-radius: var(--woof-radius-lg) var(--woof-radius-lg) var(--woof-radius-md) var(--woof-radius-md);
    box-shadow: var(--woof-shadow-xl);
    padding: var(--woof-space-2) var(--woof-space-4) var(--woof-space-4);
    pointer-events: all;
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
}

.checkin-panel-handle {
    width: 36px;
    height: 4px;
    background: var(--woof-color-neutral-300);
    border-radius: var(--woof-radius-full);
    margin: var(--woof-space-1) auto var(--woof-space-1);
    flex-shrink: 0;
}

.checkin-section {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.checkin-section-label {
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-500);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

.checkin-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 2px solid var(--woof-color-neutral-300);
    border-radius: var(--woof-radius-sm);
    font-size: 11px;
    color: var(--woof-color-neutral-0);
    transition: all var(--woof-duration-fast);
    flex-shrink: 0;
}

.checkin-checkbox--checked {
    background: var(--woof-color-brand-primary);
    border-color: var(--woof-color-brand-primary);
}

.checkin-dog-photo {
    width: var(--woof-avatar-sm);
    height: var(--woof-avatar-sm);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
}

.checkin-single-dog {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-2) 0;
}

.checkin-single-dog-name {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.checkin-duration-row {
    display: flex;
    gap: var(--woof-space-1);
}

.duration-chip {
    flex: 1;
    padding: var(--woof-space-2) var(--woof-space-3);
    min-width: 0;
    border: 1.5px solid var(--woof-color-neutral-200);
    background: none;
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    font-family: inherit;
    color: var(--woof-color-neutral-600);
    cursor: pointer;
    transition: all var(--woof-duration-fast);
    white-space: nowrap;
    text-align: center;
    height: var(--woof-btn-height-sm);
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
    padding: var(--woof-space-3) var(--woof-space-4);
    border: 1.5px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: inherit;
    color: var(--woof-color-neutral-900);
    background: var(--woof-surface-secondary);
    transition: border-color var(--woof-duration-fast), background var(--woof-duration-fast);
    box-sizing: border-box;
}

.checkin-note-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-surface-primary);
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
    height: var(--woof-btn-height-lg);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
    border-radius: var(--woof-btn-radius);
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
    transition: background var(--woof-duration-fast);
    box-shadow: var(--woof-shadow-brand);
    margin-top: var(--woof-space-1);
}

.checkin-confirm-btn:hover {
    background: var(--woof-color-brand-primary-dark);
}

.checkin-confirm-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Mode toggle pills */
.checkin-mode-toggle {
    display: flex;
    gap: 2px;
    background: var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-full);
    padding: 3px;
}

.mode-pill {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-4);
    border: none;
    background: none;
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    font-family: inherit;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    transition: all var(--woof-duration-fast);
    white-space: nowrap;
    height: 40px;
}

.mode-pill--active {
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-900);
    font-weight: var(--woof-font-weight-semibold);
    box-shadow: var(--woof-shadow-sm);
}

/* Schedule section */
.checkin-time-input {
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-4);
    border: 1.5px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: inherit;
    color: var(--woof-color-neutral-900);
    background: var(--woof-surface-secondary);
    transition: border-color var(--woof-duration-fast), background var(--woof-duration-fast);
    box-sizing: border-box;
}

.checkin-time-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-surface-primary);
}

.checkin-confirm-btn--schedule {
    background: var(--woof-color-brand-primary);
}

.checkin-confirm-btn--schedule:hover {
    background: var(--woof-color-brand-primary-dark);
}

@media (max-width: 768px) {
    .park-action-sticky {
        left: 0;
        bottom: 56px;
        padding: var(--woof-space-3) var(--woof-space-4) var(--woof-space-3);
    }

    .checkin-panel {
        max-height: 70vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: var(--woof-radius-lg) var(--woof-radius-lg) 0 0;
    }
}
</style>
