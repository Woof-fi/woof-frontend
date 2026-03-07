<script>
    import { fly, fade } from 'svelte/transition';
    import { modals, closePostOptionsSheet, openAuthModal, openEditPostModal } from '../../js/modal-store.svelte.js';
    import { reportContent, deletePost, toggleBookmark, getBookmarkStatus } from '../../js/api.js';
    import { followDog, unfollowDog, getFollowStatus } from '../../js/api.js';
    import { CONFIG } from '../../js/config.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';
    import { bumpFeedVersion } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

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

    const REASON_KEYS = [
        { key: 'inappropriate_content', i18n: 'post.reasonInappropriate' },
        { key: 'spam',                  i18n: 'post.reasonSpam' },
        { key: 'harassment',            i18n: 'post.reasonHarassment' },
        { key: 'not_a_dog',             i18n: 'post.reasonNotDog' },
        { key: 'violence',              i18n: 'post.reasonViolence' },
        { key: 'other',                 i18n: 'post.reasonOther' },
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
        const slug = dogSlug || dogId;
        if (!slug) return;
        closePostOptionsSheet();
        history.pushState({}, '', `/dog/${slug}`);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }

    // Share URL goes through the backend's OG preview endpoint so social media
    // crawlers see proper Open Graph meta tags (title, image, description).
    function getShareUrl() {
        const origin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? window.location.origin
            : CONFIG.API_BASE_URL;
        return `${origin}/share/post/${postId}`;
    }

    async function handleShare() {
        const url = getShareUrl();
        if (navigator.share) {
            try { await navigator.share({ url }); } catch { /* dismissed */ }
        } else {
            await handleCopyLink();
        }
    }

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            showToast(t('post.linkCopied'), 'success');
        } catch {
            showToast(t('post.linkCopyFailed'), 'error');
        }
        closePostOptionsSheet();
    }

    async function handleFollow() {
        if (!isAuthenticated()) { closePostOptionsSheet(); openAuthModal(); return; }
        try {
            if (isFollowing) {
                await unfollowDog(dogId);
                isFollowing = false;
                showToast(t('post.unfollowed'), 'success');
            } else {
                await followDog(dogId);
                isFollowing = true;
                showToast(t('post.nowFollowing'), 'success');
            }
        } catch {
            showToast(t('post.failedFollow'), 'error');
        }
    }

    async function handleBookmark() {
        if (!isAuthenticated()) { closePostOptionsSheet(); openAuthModal(); return; }
        try {
            const result = await toggleBookmark(postId);
            isBookmarked = result.bookmarked;
            showToast(isBookmarked ? t('post.addedFavourites') : t('post.removedFavourites'), 'success');
        } catch {
            showToast(t('post.failedFavourites'), 'error');
        }
    }

    async function confirmDelete() {
        deleting = true;
        try {
            await deletePost(postId);
            showToast(t('post.postDeleted'), 'success');
            bumpFeedVersion();
            closePostOptionsSheet();
        } catch {
            showToast(t('post.failedDeletePost'), 'error');
            deleting = false;
        }
    }

    async function handleReportReason(reason) {
        try {
            await reportContent('post', postId, reason);
            showToast(t('post.reportSubmitted'), 'success');
        } catch (err) {
            showToast(
                err?.status === 409 ? t('post.alreadyReported') : t('post.failedReport'),
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
    aria-label={t('post.postOptions')}
    in:fly={{ y: 500, duration: 280, opacity: 1 }}
    out:fly={{ y: 500, duration: 200, opacity: 1 }}
>
    {#if view === 'options'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            {#if isOwnPost}
                <button class="action-sheet-item" onclick={() => { const editData = { id: postId, caption: data?.caption }; closePostOptionsSheet(); openEditPostModal(editData); }}>
                    <i class="fas fa-pen"></i> {t('post.editCaption')}
                </button>
                <button class="action-sheet-item destructive" onclick={() => view = 'confirm-delete'}>
                    <i class="fas fa-trash-can"></i> {t('post.deletePost')}
                </button>
                <button class="action-sheet-item" onclick={goToPost}>
                    <i class="fas fa-arrow-up-right-from-square"></i> {t('post.goToPost')}
                </button>
                <button class="action-sheet-item" onclick={handleShare}>
                    <i class="fas fa-share-nodes"></i> {t('post.share')}
                </button>
                <button class="action-sheet-item" onclick={handleCopyLink}>
                    <i class="fas fa-link"></i> {t('post.copyLink')}
                </button>
            {:else}
                <button class="action-sheet-item destructive" onclick={() => !isAuthenticated() ? (closePostOptionsSheet(), openAuthModal()) : (view = 'report')}>
                    <i class="fas fa-flag"></i> {t('post.report')}
                </button>
                {#if isAuthenticated()}
                    <button class="action-sheet-item" onclick={handleFollow}>
                        <i class="fas fa-user-{isFollowing ? 'minus' : 'plus'}"></i>
                        {isFollowing ? t('post.unfollow') : t('post.follow')}
                    </button>
                    <button class="action-sheet-item" onclick={handleBookmark}>
                        <i class="{isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                        {isBookmarked ? t('post.removeFromFavourites') : t('post.addToFavourites')}
                    </button>
                {/if}
                <button class="action-sheet-item" onclick={goToPost}>
                    <i class="fas fa-arrow-up-right-from-square"></i> {t('post.goToPost')}
                </button>
                <button class="action-sheet-item" onclick={handleShare}>
                    <i class="fas fa-share-nodes"></i> {t('post.share')}
                </button>
                <button class="action-sheet-item" onclick={handleCopyLink}>
                    <i class="fas fa-link"></i> {t('post.copyLink')}
                </button>
                {#if (dogSlug || dogId) && isAuthenticated()}
                    <button class="action-sheet-item" onclick={visitProfile}>
                        <i class="fas fa-paw"></i> {t('post.visitProfile')}
                    </button>
                {/if}
            {/if}
            <button class="action-sheet-item cancel" onclick={closePostOptionsSheet}>{t('post.cancel')}</button>
        </div>

    {:else if view === 'report'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            <div class="sheet-subview-header">
                <button class="sheet-back" onclick={() => view = 'options'} aria-label={t('post.back')}>
                    <i class="fas fa-arrow-left"></i>
                </button>
                <span class="sheet-subview-title">{t('post.reportTitle')}</span>
                <span class="sheet-subview-spacer"></span>
            </div>
            {#each REASON_KEYS as reason}
                <button class="action-sheet-item" onclick={() => handleReportReason(reason.key)}>
                    {t(reason.i18n)}
                </button>
            {/each}
        </div>

    {:else if view === 'confirm-delete'}
        <div class="action-sheet-delete-confirm" in:fade={{ duration: 120, delay: 60 }}>
            <p class="action-sheet-delete-title">{t('post.deletePostConfirm')}</p>
            <p class="action-sheet-delete-subtitle">{t('post.cantBeUndone')}</p>
            <button
                class="action-sheet-delete-btn danger"
                disabled={deleting}
                onclick={confirmDelete}
            >
                {#if deleting}
                    <i class="fas fa-spinner fa-spin"></i> {t('post.deleting')}
                {:else}
                    {t('post.delete')}
                {/if}
            </button>
            <button
                class="action-sheet-delete-btn safe"
                disabled={deleting}
                onclick={() => view = 'options'}
            >
                {t('post.keepPost')}
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

.sheet-subview-header {
    display: flex;
    align-items: center;
    padding: var(--woof-space-3) var(--woof-space-3) var(--woof-space-2);
    border-bottom: 1px solid var(--color-border);
}

.sheet-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    border: none;
    background: none;
    color: var(--woof-color-neutral-700);
    font-size: var(--woof-text-body);
    cursor: pointer;
    border-radius: var(--woof-radius-full);
    transition: background var(--woof-duration-fast);
    flex-shrink: 0;
}

.sheet-back:hover {
    background: var(--woof-color-neutral-100);
}

.sheet-subview-title {
    flex: 1;
    text-align: center;
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    font-weight: var(--woof-font-weight-medium);
}

.sheet-subview-spacer {
    width: var(--woof-touch-target);
    flex-shrink: 0;
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
