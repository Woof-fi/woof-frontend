<script>
    import { fly, fade } from 'svelte/transition';
    import { modals, closeCreateActionSheet, openCreatePostModal, openHealthRecordModal, openCreateDogModal } from '../../js/modal-store.svelte.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { getMyDogs } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/toast-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import QuickVisitForm from './QuickVisitForm.svelte';

    /** @type {'menu' | 'visit' | 'pick-dog-health'} */
    let view = $state('menu');
    let healthDogs = $state([]);
    let healthLoading = $state(false);
    let instantClose = $state(false);

    // Push browser history when sheet opens, pop when it closes
    $effect(() => {
        if (modals.createActionSheetOpen) {
            pushModalState();
            view = 'menu'; // reset to menu when re-opened
            instantClose = false;
        }
    });

    /** Animated close (user taps Cancel or backdrop) */
    function close() {
        popModalState();
        closeCreateActionSheet();
    }

    /** Instant close + open another modal (no visible slide-down) */
    function closeAndOpen(fn) {
        instantClose = true;
        popModalState();
        closeCreateActionSheet();
        fn();
    }

    function handlePostPhoto() {
        closeAndOpen(() => openCreatePostModal());
    }

    async function handleHealthClick() {
        if (!isAuthenticated()) {
            close();
            showToast(t('postCreate.loginRequired'), 'error');
            return;
        }

        healthLoading = true;
        try {
            const fetchedDogs = await getMyDogs();
            if (fetchedDogs.length === 0) {
                healthLoading = false;
                closeAndOpen(() => {
                    showToast(t('postCreate.addDogFirst'), 'error');
                    openCreateDogModal();
                });
                return;
            }
            if (fetchedDogs.length === 1) {
                healthLoading = false;
                closeAndOpen(() => openHealthRecordModal(fetchedDogs[0].id, null, fetchedDogs[0].slug));
                return;
            }
            // Multiple dogs: show picker
            healthDogs = fetchedDogs;
            view = 'pick-dog-health';
        } catch {
            showToast(t('common.failedLoad'), 'error');
        }
        healthLoading = false;
    }

    function handleDogSelect(dogId) {
        closeAndOpen(() => openHealthRecordModal(dogId, null, healthDogs.find(d => d.id === dogId)?.slug));
    }

    function handleBack() {
        view = 'menu';
    }
</script>

{#if modals.createActionSheetOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="action-sheet-backdrop"
        class:instant-hide={instantClose}
        transition:fade={{ duration: 150 }}
        onclick={close}
    ></div>

    <div
        class="action-sheet"
        class:instant-hide={instantClose}
        role="dialog"
        aria-modal="true"
        aria-label="Create new content"
        in:fly={{ y: 500, duration: 280, opacity: 1 }}
        out:fly={{ y: 500, duration: 200, opacity: 1 }}
    >
        {#if view === 'menu'}
            <div class="menu-view" in:fade={{ duration: 100, delay: 60 }}>
                <div class="sheet-handle"></div>
                <div class="sheet-title">Create</div>

                <button class="action-sheet-item" onclick={handlePostPhoto}>
                    <span class="action-icon action-icon-photo">
                        <i class="fas fa-camera"></i>
                    </span>
                    <span class="action-text">
                        <span class="action-label">Post a photo</span>
                        <span class="action-desc">Share a moment with your dog</span>
                    </span>
                    <i class="fas fa-chevron-right action-chevron"></i>
                </button>

                <button class="action-sheet-item" onclick={() => view = 'visit'}>
                    <span class="action-icon action-icon-visit">
                        <i class="fas fa-calendar-plus"></i>
                    </span>
                    <span class="action-text">
                        <span class="action-label">Schedule a park visit</span>
                        <span class="action-desc">Let others know when you'll be there</span>
                    </span>
                    <i class="fas fa-chevron-right action-chevron"></i>
                </button>

                <button class="action-sheet-item" onclick={handleHealthClick} disabled={healthLoading}>
                    <span class="action-icon action-icon-health">
                        {#if healthLoading}
                            <i class="fas fa-spinner fa-spin"></i>
                        {:else}
                            <i class="fas fa-heartbeat"></i>
                        {/if}
                    </span>
                    <span class="action-text">
                        <span class="action-label">Log a health record</span>
                        <span class="action-desc">Track vet visits, weight, and more</span>
                    </span>
                    <i class="fas fa-chevron-right action-chevron"></i>
                </button>

                <button class="cancel-btn" onclick={close}>Cancel</button>
            </div>

        {:else if view === 'visit'}
            <div in:fade={{ duration: 100, delay: 60 }}>
                <QuickVisitForm onback={handleBack} onclose={close} />
            </div>

        {:else if view === 'pick-dog-health'}
            <div class="dog-picker-view" in:fade={{ duration: 100, delay: 60 }}>
                <div class="sheet-header-row">
                    <button class="back-btn" onclick={handleBack}>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h3 class="sheet-header-title">Select a dog</h3>
                </div>
                {#each healthDogs as dog (dog.id)}
                    <button class="action-sheet-item" onclick={() => handleDogSelect(dog.id)}>
                        {#if dog.profilePhoto}
                            <img
                                src={dog.profilePhoto}
                                alt={dog.name}
                                class="dog-picker-photo"
                                onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                            />
                        {:else}
                            <span class="action-icon action-icon-health">
                                <i class="fas fa-dog"></i>
                            </span>
                        {/if}
                        <span class="action-text">
                            <span class="action-label">{dog.name}</span>
                            {#if dog.breedName}
                                <span class="action-desc">{dog.breedName}</span>
                            {/if}
                        </span>
                        <i class="fas fa-chevron-right action-chevron"></i>
                    </button>
                {/each}
                <button class="cancel-btn" onclick={close}>Cancel</button>
            </div>
        {/if}
    </div>
{/if}

<style>
.instant-hide {
    display: none !important;
}

.action-sheet-backdrop {
    position: fixed;
    inset: 0;
    background: var(--woof-surface-overlay);
    z-index: 1040;
}

.action-sheet {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 540px;
    background: var(--woof-surface-primary);
    border-radius: var(--woof-radius-lg) var(--woof-radius-lg) 0 0;
    z-index: 1050;
    padding-bottom: env(safe-area-inset-bottom, 0);
    overflow: hidden;
}

.menu-view {
    padding: var(--woof-space-3) 0 var(--woof-space-2);
}

.dog-picker-view {
    padding: var(--woof-space-3) 0 var(--woof-space-2);
}

.sheet-handle {
    width: 36px;
    height: 4px;
    background: var(--woof-color-neutral-300);
    border-radius: var(--woof-radius-full);
    margin: 0 auto var(--woof-space-4);
}

.sheet-title {
    font-size: var(--woof-text-title-3);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    padding: 0 var(--woof-space-5);
    margin-bottom: var(--woof-space-4);
}

.sheet-header-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: 0 var(--woof-space-3) var(--woof-space-3);
}

.back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--woof-color-neutral-500);
    font-size: var(--woof-text-body);
    padding: var(--woof-space-1);
    border-radius: var(--woof-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    flex-shrink: 0;
    transition: background var(--woof-duration-fast);
}

.back-btn:hover {
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-900);
}

.sheet-header-title {
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.action-sheet-item {
    display: flex;
    align-items: center;
    gap: var(--woof-space-4);
    width: 100%;
    padding: var(--woof-space-4) var(--woof-space-5);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--woof-duration-fast);
    font-family: var(--woof-font-family);
}

.action-sheet-item:hover,
.action-sheet-item:active {
    background: var(--woof-color-neutral-50);
}

.action-sheet-item:disabled {
    opacity: 0.6;
    cursor: wait;
}

.action-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--woof-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--woof-text-title-3);
    flex-shrink: 0;
}

.action-icon-photo {
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary);
}

.action-icon-visit {
    background: rgba(110, 211, 195, 0.15);
    color: var(--woof-color-fresh-mint-dark);
}

.action-icon-health {
    background: rgba(255, 142, 122, 0.15);
    color: var(--woof-color-coral-peach-dark);
}

.dog-picker-photo {
    width: 44px;
    height: 44px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    object-position: center;
    flex-shrink: 0;
}

.action-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.action-label {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.action-desc {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
}

.action-chevron {
    color: var(--woof-color-neutral-300);
    font-size: var(--woof-text-footnote);
    flex-shrink: 0;
}

.cancel-btn {
    display: block;
    width: calc(100% - var(--woof-space-5) * 2);
    margin: var(--woof-space-3) auto var(--woof-space-2);
    padding: var(--woof-space-3);
    background: var(--woof-color-neutral-100);
    border: none;
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    font-family: var(--woof-font-family);
    color: var(--woof-color-neutral-600);
    cursor: pointer;
    transition: background var(--woof-duration-fast);
    text-align: center;
}

.cancel-btn:hover {
    background: var(--woof-color-neutral-200);
}

/* Desktop: centered modal instead of bottom sheet */
@media (min-width: 769px) {
    .action-sheet {
        bottom: auto;
        top: 50%;
        transform: translate(-50%, -50%);
        max-width: 480px;
        border-radius: var(--woof-radius-lg);
        padding-bottom: 0;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: var(--woof-shadow-lg);
    }

    .sheet-handle {
        display: none;
    }
}
</style>
