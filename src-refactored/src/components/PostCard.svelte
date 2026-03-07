<script>
    import { tick } from 'svelte';
    import { likePost, unlikePost, createComment, getComments } from '../../js/api.js';
    import { CONFIG } from '../../js/config.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, showToast, imageVariant } from '../../js/utils.js';
    import { openPostOptionsSheet, openCommentOptionsSheet, openLikerListModal } from '../../js/modal-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import PostImageCarousel from './PostImageCarousel.svelte';

    let {
        id = '',
        profilePic = '',
        username = '',
        caption = '',
        imageUrl = '',
        imageUrls = [],
        dogSlug = '',
        dogId = '',
        isOwnPost = false,
        likeCount = 0,
        commentCount = 0,
        likedByUser = false,
        createdAt = null,
        updatedAt = null,
        breedName = '',
        breedSlug = '',
        territoryName = '',
        territoryType = '',
        territoryParentName = '',
        territoryGrandparentName = '',
        territoryUrlPath = '',
        onopenAuthModal = null,
    } = $props();

    // --- Like state ---
    // svelte-ignore state_referenced_locally
    let liked = $state(likedByUser);
    // svelte-ignore state_referenced_locally
    let likes = $state(likeCount);
    let likeInFlight = $state(false);

    // --- Comment state ---
    let commentInput = $state('');
    let comments = $state([]);
    let commentsLoaded = $state(false);
    let commentsVisible = $state(false);
    // svelte-ignore state_referenced_locally
    let commentCount_ = $state(commentCount);
    let submittingComment = $state(false);

    // --- Timestamp toggle ---
    let showFullDate = $state(false);

    const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23cccccc" width="150" height="150"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDog%3C/text%3E%3C/svg%3E';
    const FALLBACK_POST   = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23cccccc" width="400" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';

    function isOwnComment(comment) {
        return store.userDogIds.length > 0 && store.userDogIds.includes(comment.dogId);
    }

    // --- Like handler ---
    async function handleLike() {
        if (!isAuthenticated()) {
            onopenAuthModal?.();
            return;
        }
        if (!id || likeInFlight) return;

        const wasLiked = liked;
        // Optimistic update
        liked = !wasLiked;
        likes = wasLiked ? likes - 1 : likes + 1;
        likeInFlight = true;

        try {
            let result;
            if (wasLiked) {
                result = await unlikePost(id);
            } else {
                result = await likePost(id);
            }
            if (result.likeCount !== undefined) likes = result.likeCount;
        } catch {
            // Revert on error
            liked = wasLiked;
            likes = wasLiked ? likes + 1 : likes - 1;
        } finally {
            likeInFlight = false;
        }
    }

    // --- Comment button ---
    async function handleCommentClick() {
        if (!isAuthenticated()) {
            onopenAuthModal?.();
            return;
        }
        // Expand comments if not already visible
        if (!commentsVisible && commentCount_ > 0 && !commentsLoaded) {
            try {
                const result = await getComments(id, null, 20);
                comments = result.comments || [];
                commentsLoaded = true;
                commentsVisible = true;
            } catch {
                showToast(t('post.failedLoadComments'), 'error');
            }
        } else if (!commentsVisible && commentsLoaded) {
            commentsVisible = true;
        }
        // Focus the comment input after DOM updates
        await tick();
        const input = document.querySelector(`[data-comment-input="${id}"]`);
        if (input) input.focus();
    }

    // --- Toggle / load comments ---
    async function handleViewComments(e) {
        e.preventDefault();
        if (commentsLoaded) {
            commentsVisible = !commentsVisible;
            return;
        }
        try {
            const result = await getComments(id, null, 20);
            comments = result.comments || [];
            commentsLoaded = true;
            commentsVisible = true;
        } catch {
            showToast(t('post.failedLoadComments'), 'error');
        }
    }

    // --- Submit comment ---
    async function handleSubmitComment() {
        const content = commentInput.trim();
        if (!content || !id) return;
        submittingComment = true;
        try {
            const result = await createComment(id, content);
            commentInput = '';
            comments = [result.comment, ...comments];
            commentsLoaded = true;
            commentsVisible = true;
            commentCount_ = result.commentCount ?? commentCount_ + 1;
        } catch {
            showToast(t('post.failedPostComment'), 'error');
        } finally {
            submittingComment = false;
        }
    }

    function handleCommentKeydown(e) {
        if (e.key === 'Enter' && commentInput.trim()) {
            handleSubmitComment();
        }
    }

    // --- Comment options ---
    function handleCommentOptions(e, comment) {
        e.stopPropagation();
        if (!isAuthenticated()) {
            onopenAuthModal?.();
            return;
        }
        openCommentOptionsSheet({
            commentId: comment.id,
            isOwnComment: isOwnComment(comment),
            content: comment.content,
            onDeleted: (deletedId) => {
                comments = comments.filter(c => c.id !== deletedId);
                commentCount_ = Math.max(0, commentCount_ - 1);
            },
            onUpdated: (updatedComment) => {
                comments = comments.map(c =>
                    c.id === updatedComment.id
                        ? { ...c, content: updatedComment.content, updatedAt: updatedComment.updatedAt }
                        : c
                );
            },
        });
    }

    // --- Double-tap to like ---
    let showDoubleTapHeart = $state(false);
    let lastTapTime = 0;

    function handleImageDoubleTap() {
        const now = Date.now();
        if (now - lastTapTime < 300) {
            // Double tap detected — only like (never unlike)
            if (!liked) handleLike();
            // Show heart animation even if already liked
            showDoubleTapHeart = true;
            setTimeout(() => { showDoubleTapHeart = false; }, 800);
            lastTapTime = 0;
        } else {
            lastTapTime = now;
        }
    }

    // --- Share ---
    // Share URL goes through the backend's OG preview endpoint so social media
    // crawlers see proper Open Graph meta tags (title, image, description).
    // The endpoint auto-redirects human visitors back to the SPA.
    function getShareUrl() {
        const origin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? window.location.origin    // local dev: just use SPA URL
            : CONFIG.API_BASE_URL;      // production: use backend share endpoint
        return `${origin}/share/post/${id}`;
    }

    async function handleShare() {
        const shareUrl = getShareUrl();
        if (navigator.share) {
            try {
                await navigator.share({ title: `${username} on Woof`, url: shareUrl });
            } catch {
                // User cancelled or share failed silently
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showToast(t('post.linkCopied'), 'success');
            } catch {
                showToast(t('post.linkCopyFailed'), 'error');
            }
        }
    }

    // --- Timestamp ---
    // svelte-ignore state_referenced_locally
    const createdDate = createdAt ? new Date(createdAt) : null;
    function formattedTimestamp() {
        if (!createdDate) return '';
        if (showFullDate) {
            return createdDate.toLocaleString(undefined, {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit'
            });
        }
        return timeAgo(createdAt);
    }

    // --- Multi-image detection ---
    const isMultiImage = $derived(imageUrls && imageUrls.length > 1);

    // --- Edited indicator ---
    // svelte-ignore state_referenced_locally
    const isEdited = createdAt && updatedAt
        ? (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 60000
        : false;
</script>

<div class="post">
    <!-- Header -->
    <div class="post-header">
        {#if dogSlug}
            <a href="/dog/{dogSlug}" data-link class="post-avatar-link">
                <img
                    src={profilePic || FALLBACK_AVATAR}
                    alt="{username}'s profile picture"
                    onerror={(e) => { if (e.target.src !== FALLBACK_AVATAR) e.target.src = FALLBACK_AVATAR; }}
                />
            </a>
        {:else}
            <img
                src={profilePic || FALLBACK_AVATAR}
                alt="{username}'s profile picture"
                onerror={(e) => { if (e.target.src !== FALLBACK_AVATAR) e.target.src = FALLBACK_AVATAR; }}
            />
        {/if}
        <div class="post-author-info">
            {#if dogSlug}
                <a href="/dog/{dogSlug}" data-link class="post-author-name">{username}</a>
            {:else}
                <strong>{username}</strong>
            {/if}
            <span class="post-meta-line">
                {#if breedSlug}
                    <a href="/breed/{breedSlug}" data-link class="post-breed-link">{breedName}</a>
                {:else if breedName}
                    <span>{breedName}</span>
                {/if}
                {#if territoryName}
                    {#if breedSlug || breedName}
                        <span class="post-meta-dot">&middot;</span>
                    {/if}
                    {@const territoryDisplay = territoryType === 'sub_district' && territoryParentName && territoryGrandparentName
                        ? `${territoryName}, ${territoryParentName}, ${territoryGrandparentName}`
                        : territoryType === 'district' && territoryParentName
                            ? `${territoryName}, ${territoryParentName}`
                            : territoryName}
                    {#if territoryUrlPath}
                        <a href="/territory/{territoryUrlPath}" data-link class="post-location-text">{territoryDisplay}</a>
                    {:else}
                        <span class="post-location-text">{territoryDisplay}</span>
                    {/if}
                {/if}
            </span>
        </div>
        {#if id}
            <button
                class="post-options-btn"
                aria-label={t('post.postOptions')}
                onclick={() => openPostOptionsSheet({ postId: id, dogId, dogSlug, isOwnPost, caption })}
            >
                <i class="fas fa-ellipsis" aria-hidden="true"></i>
            </button>
        {/if}
    </div>

    <!-- Post image(s) -->
    {#if isMultiImage}
        <div class="post-image">
            <PostImageCarousel
                imageUrls={imageUrls}
                username={username}
                ondoubletap={handleImageDoubleTap}
            />
            {#if showDoubleTapHeart}
                <div class="double-tap-heart" aria-hidden="true">
                    <i class="fas fa-heart"></i>
                </div>
            {/if}
        </div>
    {:else}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="post-image" onclick={handleImageDoubleTap}>
            <img
                src={imageUrl}
                srcset="{imageVariant(imageUrl, 'medium')} 600w, {imageUrl} 1200w"
                sizes="(max-width: 540px) 100vw, 500px"
                alt="Post by {username}"
                loading="lazy"
                onerror={(e) => {
                    if (e.target.srcset) {
                        e.target.srcset = '';
                        e.target.src = imageUrl;
                    } else if (e.target.src !== FALLBACK_POST) {
                        e.target.src = FALLBACK_POST;
                    }
                }}
            />
            {#if showDoubleTapHeart}
                <div class="double-tap-heart" aria-hidden="true">
                    <i class="fas fa-heart"></i>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Actions -->
    <div class="post-actions">
        <div class="post-actions-left">
            <button
                class="like-button"
                class:liked={liked}
                aria-label={liked ? t('post.unlikePost') : t('post.likePost')}
                onclick={handleLike}
            >
                <i class={liked ? 'fas fa-heart' : 'far fa-heart'} aria-hidden="true"></i>
            </button>
            <button class="like-count" onclick={() => likes > 0 && openLikerListModal(id)} disabled={likes === 0}>{likes > 0 ? likes : ''}</button>
            <button class="comment-button" aria-label={t('post.commentOnPost')} onclick={handleCommentClick}>
                <i class="far fa-comment" aria-hidden="true"></i>
            </button>
            <span class="comment-count">{commentCount_ > 0 ? commentCount_ : ''}</span>
        </div>
        {#if id}
            <button class="share-button" aria-label={t('post.sharePost')} onclick={handleShare}>
                <i class="far fa-paper-plane" aria-hidden="true"></i>
            </button>
        {/if}
    </div>

    <!-- Caption -->
    {#if caption}
        <div class="post-caption">
            <p><strong>{username}</strong> {caption}</p>
        </div>
    {/if}

    <!-- Comments section -->
    <div class="post-comments-section">
        {#if isAuthenticated()}
            {#if commentCount_ > 0 && id}
                <button class="view-all-comments" onclick={handleViewComments}>
                    {commentsVisible
                        ? t('post.hideComments')
                        : commentCount_ === 1
                            ? t('post.viewOneComment')
                            : t('post.viewComments', { count: commentCount_ })}
                </button>
            {/if}

            {#if commentsVisible}
                <div class="comments-list">
                    {#each comments as comment (comment.id)}
                        <div class="comment-item">
                            <div class="comment-item-row">
                                <div class="comment-item-content">
                                    <a href="/dog/{comment.dogSlug || comment.dogId}" data-link class="comment-author">
                                        <strong>{comment.dogName}</strong>
                                    </a>
                                    <span class="comment-content"> {comment.content}</span>
                                    <span class="comment-time">
                                        {timeAgo(comment.createdAt)}
                                        {#if comment.updatedAt && comment.createdAt && (new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime()) > 60000}
                                            <span class="comment-edited">{t('post.edited')}</span>
                                        {/if}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    class="comment-options-btn"
                                    aria-label={t('post.commentOptions')}
                                    onclick={(e) => handleCommentOptions(e, comment)}
                                >
                                    <i class="fas fa-ellipsis" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if id}
                <div class="comment-form">
                    <input
                        type="text"
                        name="comment"
                        class="comment-input"
                        placeholder={t('post.addComment')}
                        maxlength="2200"
                        autocomplete="off"
                        data-comment-input={id}
                        bind:value={commentInput}
                        onkeydown={handleCommentKeydown}
                    />
                    <button
                        class="comment-submit"
                        disabled={!commentInput.trim() || submittingComment}
                        onclick={handleSubmitComment}
                    >{t('post.postComment')}</button>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Timestamp -->
    {#if createdDate}
        <div class="post-timestamp-container">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <time
                class="post-timestamp"
                datetime={createdDate.toISOString()}
                title={createdDate.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                style="cursor:pointer"
                onclick={() => showFullDate = !showFullDate}
            >{formattedTimestamp()}</time>
            {#if isEdited}
                <span class="post-edited-indicator">{t('post.edited')}</span>
            {/if}
        </div>
    {/if}
</div>

<style>
.post {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    margin: 0 auto 20px;
    border-radius: var(--woof-radius-lg);
    max-width: 500px;
    width: 100%;
    overflow: hidden;
    box-shadow: var(--woof-shadow-sm);
}

.post-header {
    padding: var(--woof-space-2) var(--woof-space-3);
    display: flex;
    align-items: center;
    gap: 0;
}

.post-header img {
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    margin-right: var(--woof-space-2);
    flex-shrink: 0;
}

.post-avatar-link {
    flex-shrink: 0;
}

.post-author-name {
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    text-decoration: none;
}

.post-author-name:hover {
    text-decoration: underline;
}

.post-author-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
}

.post-meta-line {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    min-width: 0;
}

.post-breed-link {
    color: var(--woof-color-neutral-500);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post-breed-link:hover {
    color: var(--woof-color-brand-primary);
    text-decoration: underline;
}

.post-meta-dot {
    flex-shrink: 0;
    color: var(--woof-color-neutral-400);
}

.post-location-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    color: inherit;
}

a.post-location-text:hover {
    text-decoration: underline;
}

.post-timestamp-container {
    padding: 0 10px 10px;
}

.post-timestamp {
    font-size: 10px;
    color: var(--woof-color-neutral-500);
    text-transform: uppercase;
    letter-spacing: 0.2px;
}

.post-edited-indicator {
    font-size: 10px;
    color: var(--woof-color-neutral-400);
    margin-left: var(--woof-space-1);
}

.post-image {
    position: relative;
    width: 100%;
    overflow: hidden;
    background-color: var(--color-bg-secondary, #fafafa);
    container-type: inline-size;
}

.post-image img {
    width: 100%;
    display: block;
    object-fit: cover;
    max-height: calc(100cqi * 1.25);
}

.post-actions {
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.post-actions-left {
    display: flex;
    align-items: center;
}

.post-actions button {
    background: none;
    border: none;
    font-size: 24px;
    padding: 8px;
    margin-right: 4px;
    cursor: pointer;
    color: var(--color-text);
}

.post-actions button.liked i,
.post-actions .like-button.liked i {
    color: var(--color-like);
}

.post-actions .like-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    margin-right: 12px;
    vertical-align: middle;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
}

.post-actions .like-count:disabled {
    cursor: default;
    opacity: 1;
}

.post-actions .like-button {
    transition: transform 0.2s ease;
}

.post-actions .comment-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    margin-right: 12px;
    vertical-align: middle;
}

.share-button {
    margin-right: 0;
}

/* Double-tap heart animation */
.double-tap-heart {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 80px;
    color: var(--woof-color-neutral-0);
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
    pointer-events: none;
    animation: double-tap-pop var(--woof-duration-slower) var(--woof-ease-bounce) forwards;
    z-index: 1;
}

@keyframes double-tap-pop {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
    15% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
}

.post-caption {
    padding: 0 10px 10px;
}

.post-comments-section {
    padding: 0 10px 8px;
}

.view-all-comments {
    display: block;
    color: var(--color-text-muted);
    font-size: 14px;
    text-decoration: none;
    margin-bottom: 6px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    text-align: left;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.comment-item {
    font-size: 14px;
    line-height: 1.4;
    position: relative;
}

.comment-item-row {
    display: flex;
    align-items: flex-start;
    gap: var(--woof-space-2);
}

.comment-item-content {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    line-height: 1.4;
}

.comment-author {
    text-decoration: none;
    color: var(--color-text);
}

.comment-content {
    color: var(--color-text);
}

.comment-time {
    display: block;
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 2px;
}

.comment-edited {
    color: var(--woof-color-neutral-400);
    font-style: italic;
    margin-left: 4px;
}

.comment-form {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
}

.comment-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    color: var(--color-text);
    padding: 4px 0;
}

.comment-input::placeholder {
    color: var(--color-text-muted);
}

.comment-submit {
    background: none;
    border: none;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 0;
}

.comment-submit:disabled {
    opacity: 0.4;
    cursor: default;
}

/* Comment options button */
.comment-options-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 4px;
    border-radius: var(--woof-radius-xs);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 24px;
    flex-shrink: 0;
    transition: color var(--woof-duration-fast), opacity var(--woof-duration-fast);
    opacity: 1;
    margin-top: 2px;
}

.comment-options-btn:hover {
    color: var(--color-text);
}

@media (hover: hover) {
    .comment-options-btn {
        opacity: 0;
    }
    .comment-item:hover .comment-options-btn {
        opacity: 1;
    }
}

/* Post options button */
.post-options-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--woof-color-neutral-500);
    font-size: var(--woof-font-size-base);
    padding: var(--woof-space-1) var(--woof-space-2);
    border-radius: var(--woof-radius-sm);
    line-height: 1;
    display: flex;
    align-items: center;
}

.post-options-btn:hover {
    color: var(--woof-color-neutral-900);
    background: var(--woof-color-neutral-100);
}
</style>
