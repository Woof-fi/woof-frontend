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
    import PostHeader from './PostHeader.svelte';
    import PostActions from './PostActions.svelte';
    import PostComments from './PostComments.svelte';
    import PostTimestamp from './PostTimestamp.svelte';

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
        parkName = '',
        parkNameFi = '',
        parkSlug = '',
        taggedDogs = [],
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

    const FALLBACK_POST = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23cccccc" width="400" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';

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

    // --- Multi-image detection ---
    const isMultiImage = $derived(imageUrls && imageUrls.length > 1);
</script>

<div class="post">
    <!-- Header -->
    <PostHeader
        {dogSlug}
        {username}
        {profilePic}
        {breedName}
        {breedSlug}
        {territoryName}
        {territoryType}
        {territoryParentName}
        {territoryGrandparentName}
        {territoryUrlPath}
        {parkName}
        {parkNameFi}
        {parkSlug}
        {isOwnPost}
        {id}
        {dogId}
        {caption}
        onOptionsClick={() => openPostOptionsSheet({ postId: id, dogId, dogSlug, isOwnPost, caption })}
    />

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
    <PostActions
        {liked}
        {likes}
        {likeInFlight}
        commentCount={commentCount_}
        postId={id}
        onLike={handleLike}
        onCommentClick={handleCommentClick}
        onShare={handleShare}
        onLikeCountClick={() => likes > 0 && openLikerListModal(id)}
    />

    <!-- Caption -->
    {#if caption}
        <div class="post-caption">
            <p><strong>{username}</strong> {caption}</p>
        </div>
    {/if}

    <!-- Tagged dogs -->
    {#if taggedDogs && taggedDogs.length > 0}
        <div class="post-tagged-dogs">
            <i class="fas fa-tag post-tag-icon" aria-hidden="true"></i>
            {#each taggedDogs as dog, i (dog.id)}
                <a href="/dog/{dog.slug}" data-link class="post-tagged-link">{dog.name}</a>{#if i < taggedDogs.length - 1}<span class="post-tag-sep">,</span>{/if}
            {/each}
        </div>
    {/if}

    <!-- Comments section -->
    <PostComments
        postId={id}
        isAuthenticated={isAuthenticated()}
        commentCount={commentCount_}
        {comments}
        {commentsVisible}
        {commentsLoaded}
        bind:commentInput={commentInput}
        {submittingComment}
        onViewComments={handleViewComments}
        onSubmitComment={handleSubmitComment}
        onCommentKeydown={handleCommentKeydown}
        onCommentOptionsClick={handleCommentOptions}
    />

    <!-- Timestamp -->
    <PostTimestamp
        {createdAt}
        {updatedAt}
        bind:showFullDate={showFullDate}
    />
</div>

<style>
.post {
    background-color: var(--woof-surface-primary);
    border: 1px solid var(--woof-color-neutral-200);
    margin: 0 auto 20px;
    border-radius: var(--woof-radius-lg);
    max-width: 500px;
    width: 100%;
    overflow: hidden;
    box-shadow: var(--woof-shadow-sm);
}

.post-image {
    position: relative;
    width: 100%;
    overflow: hidden;
    background-color: var(--woof-surface-secondary, #fafafa);
    container-type: inline-size;
}

.post-image img {
    width: 100%;
    display: block;
    object-fit: cover;
    max-height: calc(100cqi * 1.25);
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

.post-tagged-dogs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px;
    padding: 0 var(--woof-space-3) var(--woof-space-2);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    line-height: 1.4;
}

.post-tag-icon {
    font-size: 0.75em;
    color: var(--woof-color-neutral-400);
    margin-right: 2px;
    flex-shrink: 0;
}

.post-tagged-link {
    color: var(--woof-color-neutral-700);
    text-decoration: none;
    font-weight: var(--woof-font-weight-medium);
}

.post-tagged-link:hover {
    color: var(--woof-color-brand-primary);
    text-decoration: underline;
}

.post-tag-sep {
    color: var(--woof-color-neutral-400);
}
</style>
