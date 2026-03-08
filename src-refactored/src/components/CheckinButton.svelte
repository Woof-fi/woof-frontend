<script>
    import { checkInAtPark, checkOutFromPark } from '../../js/api.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import { store } from '../../js/svelte-store.svelte.js';

    let {
        parkId = '',
        myDogs = [],
        activeCheckins = [],
        onCheckin = null,
        onCheckout = null,
    } = $props();

    let submitting = $state(false);
    let showCheckinForm = $state(false);
    let selectedDogId = $state('');
    let note = $state('');

    let authed = $derived(store.authUser !== null);

    // Find if any of the user's dogs are already checked in
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
            await checkInAtPark(parkId, { dogId, note: note.trim() || undefined });
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

    function handleClick() {
        if (isCheckedIn) {
            handleCheckOut();
        } else {
            showCheckinForm = !showCheckinForm;
            if (showCheckinForm && myDogs.length === 1) {
                selectedDogId = myDogs[0].id;
            }
        }
    }
</script>

<div class="checkin-wrapper">
    {#if !authed}
        <button class="checkin-btn checkin-btn--disabled" disabled>
            <i class="fas fa-paw"></i>
            {t('dogPark.loginToCheckIn')}
        </button>
    {:else if myDogs.length === 0}
        <!-- No dogs, don't render button -->
    {:else if isCheckedIn}
        <button
            class="checkin-btn checkin-btn--checked-in"
            onclick={handleClick}
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
            class="checkin-btn checkin-btn--active"
            onclick={handleClick}
            disabled={submitting}
        >
            {#if submitting}
                <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.checkIn')}</span>
            {:else}
                <span class="btn-content"><i class="fas fa-paw"></i> {t('dogPark.checkIn')}</span>
            {/if}
        </button>
    {/if}

    {#if showCheckinForm}
        <div class="checkin-form">
            {#if myDogs.length > 1}
                <p class="checkin-form-label">{t('dogPark.selectDogToCheckIn')}</p>
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
                            <span class="checkin-dog-name">{dog.name}</span>
                        </button>
                    {/each}
                </div>
            {/if}
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
</div>

<style>
.checkin-wrapper {
    position: relative;
}

.checkin-btn {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-4);
    border-radius: var(--woof-radius-full);
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-caption-1);
    font-family: inherit;
    cursor: pointer;
    transition: all var(--woof-duration-fast) ease;
    white-space: nowrap;
}

.checkin-btn--active {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: 2px solid var(--woof-color-brand-primary);
}

.checkin-btn--active:hover {
    background: var(--woof-color-brand-primary-dark);
    border-color: var(--woof-color-brand-primary-dark);
}

.checkin-btn--checked-in {
    background: transparent;
    color: var(--woof-color-brand-primary);
    border: 2px solid var(--woof-color-brand-primary);
}

.checkin-btn--checked-in:hover {
    background: var(--woof-color-brand-primary-subtle);
}

.checkin-btn--disabled {
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-400);
    border: 2px solid var(--woof-color-neutral-200);
    cursor: default;
}

.btn-content {
    display: contents;
}

.checkin-btn:disabled {
    opacity: 0.6;
    cursor: default;
}

/* Check-in form dropdown */
.checkin-form {
    position: absolute;
    top: calc(100% + var(--woof-space-2));
    left: 0;
    background: var(--woof-surface-primary);
    border-radius: var(--woof-radius-lg);
    box-shadow: var(--woof-shadow-lg);
    padding: var(--woof-space-3);
    z-index: 20;
    width: calc(100vw - 32px);
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
    box-sizing: border-box;
}

.checkin-form-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.checkin-dog-list {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
}

.checkin-dog-option {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    width: 100%;
    padding: var(--woof-space-2);
    border: 2px solid transparent;
    background: none;
    border-radius: var(--woof-radius-sm);
    cursor: pointer;
    font-family: inherit;
    transition: all var(--woof-duration-fast) ease;
}

.checkin-dog-option:hover {
    background: var(--woof-color-neutral-50);
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

.checkin-dog-name {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-900);
}

.checkin-note-input {
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-caption-1);
    font-family: inherit;
    color: var(--woof-color-neutral-900);
    background: var(--woof-surface-primary);
    transition: border-color var(--woof-duration-fast) ease;
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
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
    transition: background var(--woof-duration-fast) ease;
}

.checkin-confirm-btn:hover {
    background: var(--woof-color-brand-primary-dark);
}

.checkin-confirm-btn:disabled {
    opacity: 0.6;
    cursor: default;
}
</style>
