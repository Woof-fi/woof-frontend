<script>
    import { fly, fade } from 'svelte/transition';
    import { modals, closePostOptionsSheet, openAuthModal } from '../../js/modal-store.svelte.js';
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
