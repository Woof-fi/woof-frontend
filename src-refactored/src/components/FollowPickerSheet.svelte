<script>
    import { fly, fade } from 'svelte/transition';
    import { reduceMotion } from '../../js/motion.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { getMyDogs, getFollowStatus, batchFollowDog, getOwnerDogs } from '../../js/api.js';
    import { modals, closeFollowPickerSheet } from '../../js/modal-store.svelte.js';
    import { showToast } from '../../js/toast-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { focusTrap } from '../actions/focus-trap.ts';

    let dogs = $state([]);
    let selected = $state(new Set());
    let alreadyFollowing = $state(new Set());
    let loading = $state(true);
    let submitting = $state(false);

    let selectedCount = $derived(selected.size);

    // Capture data before async operations since modal may close
    let targetDogId = $derived(modals.followPickerSheetData?.targetDogId);
    let targetDogName = $derived(modals.followPickerSheetData?.targetDogName);

    $effect(() => {
        if (modals.followPickerSheetOpen && modals.followPickerSheetData) {
            loadDogs();
            pushModalState();
        }
    });

    async function loadDogs() {
        loading = true;
        try {
            const myDogs = await getMyDogs();
            // Exclude the target dog (can't follow yourself)
            const targetId = modals.followPickerSheetData.targetDogId;
            dogs = (myDogs || []).filter(d => d.id !== targetId);
            // Check which already follow target (parallel for speed)
            const already = new Set();
            const preSelected = new Set();
            const statuses = await Promise.all(
                dogs.map(dog =>
                    getFollowStatus(modals.followPickerSheetData.targetDogId, dog.id)
                        .catch(() => ({ isFollowing: false }))
                )
            );
            for (let i = 0; i < dogs.length; i++) {
                if (statuses[i].isFollowing) {
                    already.add(dogs[i].id);
                } else if (dogs[i].id === store.currentDog?.id) {
                    preSelected.add(dogs[i].id);
                }
            }
            alreadyFollowing = already;
            selected = preSelected;
        } catch (e) {
            console.error('Load dogs error:', e);
        } finally {
            loading = false;
        }
    }

    function toggleDog(dogId) {
        if (alreadyFollowing.has(dogId)) return;
        const next = new Set(selected);
        if (next.has(dogId)) next.delete(dogId);
        else next.add(dogId);
        selected = next;
    }

    async function handleSubmit() {
        const ids = [...selected];
        if (ids.length === 0) return;
        submitting = true;
        // Capture callback and data before closing
        const onFollowed = modals.followPickerSheetData?.onFollowed;
        const capturedTargetDogId = modals.followPickerSheetData?.targetDogId;
        const capturedTargetDogName = modals.followPickerSheetData?.targetDogName;
        try {
            await batchFollowDog(capturedTargetDogId, ids);
            showToast(t('follow.followSuccess'), 'success');
            onFollowed?.();
            closeFollowPickerSheet();
            popModalState();
            // Check for owner's other dogs suggestion
            suggestOwnerDogs(capturedTargetDogId, capturedTargetDogName);
        } catch (e) {
            showToast(t('profile.actionFailed'), 'error');
        } finally {
            submitting = false;
        }
    }

    async function suggestOwnerDogs(dogId, dogName) {
        try {
            const ownerDogs = await getOwnerDogs(dogId, store.currentDog?.id);
            const unfollowed = (ownerDogs || []).filter(d => !d.isFollowing && d.id !== store.currentDog?.id);
            if (unfollowed.length > 0) {
                const names = unfollowed.map(d => d.name).join(', ');
                showToast(
                    t('follow.ownerHasOtherDogs')
                        .replace('{name}', dogName)
                        .replace('{names}', names),
                    'info'
                );
            }
        } catch { /* ignore */ }
    }

    function handleClose() {
        closeFollowPickerSheet();
        popModalState();
    }

    function handleImageError(e) {
        e.target.src = '/images/dog_profile_pic.jpg';
    }
</script>

{#if modals.followPickerSheetOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="action-sheet-backdrop"
        transition:fade={reduceMotion({ duration: 150 })}
        onclick={handleClose}
    ></div>

    <div
        class="action-sheet follow-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('follow.pickDogs')}
        in:fly={reduceMotion({ y: 500, duration: 280, opacity: 1 })}
        out:fly={reduceMotion({ y: 500, duration: 200, opacity: 1 })}
        use:focusTrap
    >
        <div class="follow-picker-header">
            <span class="follow-picker-title">{t('follow.pickDogs')}</span>
        </div>

        <div class="follow-picker-list">
            {#if loading}
                <div class="follow-picker-loading">
                    <span class="woof-spinner"></span>
                </div>
            {:else}
                {#each dogs as dog (dog.id)}
                    {@const isAlready = alreadyFollowing.has(dog.id)}
                    {@const isSelected = selected.has(dog.id)}
                    <button
                        class="follow-picker-row"
                        class:disabled={isAlready}
                        onclick={() => toggleDog(dog.id)}
                        disabled={isAlready}
                    >
                        <img
                            src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                            alt={dog.name}
                            class="follow-picker-avatar"
                            onerror={handleImageError}
                        />
                        <div class="follow-picker-info">
                            <span class="follow-picker-name">{dog.name}</span>
                            {#if isAlready}
                                <span class="follow-picker-already">{t('follow.alreadyFollowing')}</span>
                            {:else if dog.breed}
                                <span class="follow-picker-breed">{dog.breed}</span>
                            {/if}
                        </div>
                        <div class="follow-picker-check">
                            {#key `${isAlready}-${isSelected}`}
                                {#if isAlready}
                                    <i class="fas fa-circle-check follow-picker-check-disabled"></i>
                                {:else if isSelected}
                                    <i class="fas fa-circle-check follow-picker-check-active"></i>
                                {:else}
                                    <i class="far fa-circle follow-picker-check-empty"></i>
                                {/if}
                            {/key}
                        </div>
                    </button>
                {/each}
            {/if}
        </div>

        <div class="follow-picker-footer">
            <button
                class="follow-picker-submit"
                disabled={selectedCount === 0 || submitting}
                onclick={handleSubmit}
            >
                {#key submitting}
                    {#if submitting}
                        <span class="woof-spinner"></span>
                    {:else}
                        {t('follow.followCount').replace('{count}', String(selectedCount))}
                    {/if}
                {/key}
            </button>
        </div>

        <button class="action-sheet-item cancel" onclick={handleClose}>{t('post.cancel')}</button>
    </div>
{/if}

<style>
@import '../../css/action-sheet.css';

.follow-picker-sheet {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
}

.follow-picker-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--woof-space-4) var(--woof-space-5) var(--woof-space-3);
    border-bottom: 1px solid var(--woof-color-neutral-200);
}

.follow-picker-title {
    font-size: var(--woof-text-title-3);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.follow-picker-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--woof-space-2) 0;
}

.follow-picker-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--woof-space-8) 0;
}

.follow-picker-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-5);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--woof-duration-fast);
}

.follow-picker-row:hover:not(:disabled) {
    background: var(--woof-color-neutral-50);
}

.follow-picker-row.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.follow-picker-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.follow-picker-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.follow-picker-name {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.follow-picker-breed {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
}

.follow-picker-already {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    font-style: italic;
}

.follow-picker-check {
    flex-shrink: 0;
    font-size: 22px;
    display: flex;
    align-items: center;
}

.follow-picker-check-active {
    color: var(--woof-color-brand-primary);
}

.follow-picker-check-disabled {
    color: var(--woof-color-neutral-300);
}

.follow-picker-check-empty {
    color: var(--woof-color-neutral-300);
}

.follow-picker-footer {
    padding: var(--woof-space-3) var(--woof-space-5);
    border-top: 1px solid var(--woof-color-neutral-200);
}

.follow-picker-submit {
    width: 100%;
    height: var(--woof-btn-height-lg);
    border: none;
    border-radius: var(--woof-btn-radius);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    transition: background var(--woof-duration-fast);
    display: flex;
    align-items: center;
    justify-content: center;
}

.follow-picker-submit:hover:not(:disabled) {
    background: var(--woof-color-brand-primary-dark);
}

.follow-picker-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
