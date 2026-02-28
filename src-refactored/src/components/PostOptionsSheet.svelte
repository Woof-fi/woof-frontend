<script>
    import { fly, fade } from 'svelte/transition';
    import { modals, closePostOptionsSheet, openAuthModal, openEditPostModal } from '../../js/modal-store.svelte.js';
    import { reportContent, deletePost, toggleBookmark, getBookmarkStatus } from '../../js/api.js';
    import { followDog, unfollowDog, getFollowStatus } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';
    import { bumpFeedVersion } from '../../js/svelte-store.svelte.js';

    let data      = $derived(modals.postOptionsSheetData);
    let postId    = $derived(data?.postId ?? '');
    let dogId     = $derived(data?.dogId ?? '');
    let dogSlug   = $derived(data?.dogSlug ?? '');
    let isOwnPost = $derived(data?.isOwnPost ?? false);

    // 'options' | 'report' | 'confirm-delete'
    let view     = $state('options');
    let deleting = $state(false);

    let isFollowing  = $state(false);
    let isBookmarked = $state(false);

    const REASONS = [
        { key: 'inappropriate_content', label: 'Inappropriate content' },
        { key: 'spam',                  label: 'Spam' },
        { key: 'harassment',            label: 'Harassment' },
        { key: 'not_a_dog',             label: 'Not a dog' },
        { key: 'violence',              label: 'Violence' },
        { key: 'other',                 label: 'Other' },
    ];

    $effect(() => {
        if (!modals.postOptionsSheetOpen) {
            view = 'options';
            deleting = false;
            isFollowing = false;
            isBookmarked = false;
            return;
        }
        if (!isAuthenticated() || !dogId || !postId) return;

        (async () => {
            try {
                const [f, b] = await Promise.all([
                    getFollowStatus(dogId).catch(() => null),
                    getBookmarkStatus(postId).catch(() => null),
                ]);
                isFollowing  = f?.isFollowing ?? false;
                isBookmarked = b?.bookmarked  ?? false;
            } catch { /* silent */ }
        })();
    });

    function goToPost() {
        closePostOptionsSheet();
        history.pushState({}, '', `/post/${postId}`);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }

    function visitProfile() {
        closePostOptionsSheet();
        history.pushState({}, '', `/dog/${dogSlug}`);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }

    async function handleShare() {
        const url = `${window.location.origin}/post/${postId}`;
        if (navigator.share) {
            try { await navigator.share({ url }); } catch { /* dismissed */ }
        } else {
            await handleCopyLink();
        }
    }

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
            showToast('Link copied', 'success');
        } catch {
            showToast('Could not copy link', 'error');
        }
        closePostOptionsSheet();
    }

    async function handleFollow() {
        if (!isAuthenticated()) { closePostOptionsSheet(); openAuthModal(); return; }
        try {
            if (isFollowing) {
                await unfollowDog(dogId);
                isFollowing = false;
                showToast('Unfollowed', 'success');
            } else {
                await followDog(dogId);
                isFollowing = true;
                showToast('Following!', 'success');
            }
        } catch {
            showToast('Failed to update follow status', 'error');
        }
    }

    async function handleBookmark() {
        if (!isAuthenticated()) { closePostOptionsSheet(); openAuthModal(); return; }
        try {
            const result = await toggleBookmark(postId);
            isBookmarked = result.bookmarked;
            showToast(isBookmarked ? 'Added to favourites' : 'Removed from favourites', 'success');
        } catch {
            showToast('Failed to update favourites', 'error');
        }
    }

    async function confirmDelete() {
        deleting = true;
        try {
            await deletePost(postId);
            showToast('Post deleted', 'success');
            bumpFeedVersion();
            closePostOptionsSheet();
        } catch {
            showToast('Failed to delete post', 'error');
            deleting = false;
        }
    }

    async function handleReportReason(reason) {
        try {
            await reportContent('post', postId, reason);
            showToast('Report submitted. Thank you!', 'success');
        } catch (err) {
            showToast(
                err?.status === 409 ? 'Already reported' : 'Failed to submit report',
                err?.status === 409 ? 'info' : 'error'
            );
        }
        closePostOptionsSheet();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="action-sheet-backdrop"
    transition:fade={{ duration: 150 }}
    onclick={closePostOptionsSheet}
></div>

<div
    class="action-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="Post options"
    in:fly={{ y: 500, duration: 280, opacity: 1 }}
    out:fly={{ y: 500, duration: 200, opacity: 1 }}
>
    {#if view === 'options'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            {#if isOwnPost}
                <button class="action-sheet-item" onclick={() => { closePostOptionsSheet(); openEditPostModal({ id: postId, caption: data?.caption }); }}>
                    <i class="fas fa-pen"></i> Edit caption
                </button>
                <button class="action-sheet-item destructive" onclick={() => view = 'confirm-delete'}>
                    <i class="fas fa-trash-alt"></i> Delete post
                </button>
                <button class="action-sheet-item" onclick={goToPost}>
                    <i class="fas fa-external-link-alt"></i> Go to post
                </button>
                <button class="action-sheet-item" onclick={handleShare}>
                    <i class="fas fa-share-alt"></i> Share
                </button>
                <button class="action-sheet-item" onclick={handleCopyLink}>
                    <i class="fas fa-link"></i> Copy link
                </button>
            {:else}
                <button class="action-sheet-item destructive" onclick={() => !isAuthenticated() ? (closePostOptionsSheet(), openAuthModal()) : (view = 'report')}>
                    <i class="fas fa-flag"></i> Report
                </button>
                {#if isAuthenticated()}
                    <button class="action-sheet-item" onclick={handleFollow}>
                        <i class="fas fa-user-{isFollowing ? 'minus' : 'plus'}"></i>
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button class="action-sheet-item" onclick={handleBookmark}>
                        <i class="{isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                        {isBookmarked ? 'Remove from favourites' : 'Add to favourites'}
                    </button>
                {/if}
                <button class="action-sheet-item" onclick={goToPost}>
                    <i class="fas fa-external-link-alt"></i> Go to post
                </button>
                <button class="action-sheet-item" onclick={handleShare}>
                    <i class="fas fa-share-alt"></i> Share
                </button>
                <button class="action-sheet-item" onclick={handleCopyLink}>
                    <i class="fas fa-link"></i> Copy link
                </button>
                {#if dogSlug && isAuthenticated()}
                    <button class="action-sheet-item" onclick={visitProfile}>
                        <i class="fas fa-paw"></i> Visit profile
                    </button>
                {/if}
            {/if}
            <button class="action-sheet-item cancel" onclick={closePostOptionsSheet}>Cancel</button>
        </div>

    {:else if view === 'report'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            <div class="action-sheet-title">Why are you reporting this?</div>
            {#each REASONS as reason}
                <button class="action-sheet-item" onclick={() => handleReportReason(reason.key)}>
                    {reason.label}
                </button>
            {/each}
            <button class="action-sheet-item cancel" onclick={() => view = 'options'}>← Back</button>
        </div>

    {:else if view === 'confirm-delete'}
        <div class="action-sheet-delete-confirm" in:fade={{ duration: 120, delay: 60 }}>
            <p class="action-sheet-delete-title">Delete this post?</p>
            <p class="action-sheet-delete-subtitle">This can't be undone.</p>
            <button
                class="action-sheet-delete-btn danger"
                disabled={deleting}
                onclick={confirmDelete}
            >
                {#if deleting}
                    <i class="fas fa-spinner fa-spin"></i> Deleting…
                {:else}
                    Delete
                {/if}
            </button>
            <button
                class="action-sheet-delete-btn safe"
                disabled={deleting}
                onclick={() => view = 'options'}
            >
                Keep post
            </button>
        </div>
    {/if}
</div>

<style>
.action-sheet-backdrop {
    position: fixed;
    inset: 0;
    background: var(--woof-surface-overlay);
    z-index: var(--woof-z-modal-backdrop, 1040);
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
    z-index: var(--woof-z-modal, 1050);
    padding-bottom: env(safe-area-inset-bottom, 0);
    overflow: hidden;
}

.action-sheet-title {
    padding: var(--woof-space-4) var(--woof-space-4) var(--woof-space-2);
    font-size: var(--woof-font-size-sm);
    color: var(--woof-color-neutral-500);
    font-weight: var(--woof-font-weight-medium);
    text-align: center;
    border-bottom: 1px solid var(--color-border);
}

.action-sheet-delete-confirm {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--woof-space-6) var(--woof-space-5) var(--woof-space-5);
    gap: var(--woof-space-3);
}

.action-sheet-delete-title {
    margin: 0;
    font-size: var(--woof-font-size-lg);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    text-align: center;
}

.action-sheet-delete-subtitle {
    margin: 0;
    font-size: var(--woof-font-size-sm);
    color: var(--woof-color-neutral-400);
    text-align: center;
}

.action-sheet-delete-btn {
    width: 100%;
    height: 52px;
    border: none;
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-font-size-base);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    transition: opacity var(--woof-duration-fast, 0.15s);
}

.action-sheet-delete-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.action-sheet-delete-btn.danger {
    background: var(--woof-color-error);
    color: var(--woof-color-neutral-0);
}

.action-sheet-delete-btn.danger:hover:not(:disabled) {
    opacity: 0.88;
}

.action-sheet-delete-btn.safe {
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-700);
}

.action-sheet-delete-btn.safe:hover:not(:disabled) {
    background: var(--woof-color-neutral-200);
}

.action-sheet-item {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    width: 100%;
    min-height: 56px;
    padding: 0 var(--woof-space-5);
    background: none;
    border: none;
    border-top: 1px solid var(--color-border);
    font-size: var(--woof-font-size-base);
    color: var(--woof-color-neutral-900);
    cursor: pointer;
    text-align: left;
    transition: background var(--woof-duration-fast, 0.15s);
}

.action-sheet-item:first-child {
    border-top: none;
}

.action-sheet-item:hover,
.action-sheet-item:active {
    background: var(--woof-color-neutral-50);
}

.action-sheet-item.destructive {
    color: var(--woof-color-error, #E53E3E);
}

.action-sheet-item.cancel {
    font-weight: var(--woof-font-weight-bold);
    margin-top: var(--woof-space-2);
    border-top: 8px solid var(--woof-color-neutral-100);
    justify-content: center;
    color: var(--woof-color-neutral-700);
}
</style>
