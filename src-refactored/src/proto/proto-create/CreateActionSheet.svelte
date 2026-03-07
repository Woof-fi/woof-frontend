<script>
    import { fly, fade } from 'svelte/transition';
    import { openCreatePostModal } from '../../../js/modal-store.svelte.js';
    import QuickVisitForm from './QuickVisitForm.svelte';
    import QuickHealthForm from './QuickHealthForm.svelte';

    let { onclose = null } = $props();

    /** @type {'menu' | 'visit' | 'health'} */
    let view = $state('menu');

    function handlePostPhoto() {
        onclose?.();
        openCreatePostModal();
    }

    function handleBack() {
        view = 'menu';
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="action-sheet-backdrop"
    transition:fade={{ duration: 150 }}
    onclick={() => onclose?.()}
></div>

<div
    class="action-sheet"
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

            <button class="action-sheet-item" onclick={() => view = 'health'}>
                <span class="action-icon action-icon-health">
                    <i class="fas fa-heart-pulse"></i>
                </span>
                <span class="action-text">
                    <span class="action-label">Log a health record</span>
                    <span class="action-desc">Track vet visits, weight, and more</span>
                </span>
                <i class="fas fa-chevron-right action-chevron"></i>
            </button>

            <button class="cancel-btn" onclick={() => onclose?.()}>Cancel</button>
        </div>

    {:else if view === 'visit'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            <QuickVisitForm onback={handleBack} onclose={onclose} />
        </div>

    {:else if view === 'health'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            <QuickHealthForm onback={handleBack} onclose={onclose} />
        </div>
    {/if}
</div>

<style>
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
}

.action-sheet-item:hover,
.action-sheet-item:active {
    background: var(--woof-color-neutral-50);
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
</style>
