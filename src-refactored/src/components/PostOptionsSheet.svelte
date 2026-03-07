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
@import '../../css/action-sheet.css';
</style>
