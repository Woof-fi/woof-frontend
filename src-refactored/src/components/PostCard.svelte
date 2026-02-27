<script>
    import { likePost, unlikePost, createComment, getComments } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, showToast, imageVariant } from '../../js/utils.js';
    import { openPostOptionsSheet, openCommentOptionsSheet } from '../../js/modal-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';

    let {
        id = '',
        profilePic = '',
        username = '',
        caption = '',
        imageUrl = '',
        dogSlug = '',
        dogId = '',
        isOwnPost = false,
        likeCount = 0,
        commentCount = 0,
        likedByUser = false,
        createdAt = null,
        breedName = '',
        breedSlug = '',
        territoryName = '',
        territoryType = '',
        territoryParentName = '',
        territoryGrandparentName = '',
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
    function handleCommentClick() {
        if (!isAuthenticated()) {
            onopenAuthModal?.();
            return;
        }
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
            showToast('Failed to load comments', 'error');
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
            showToast('Failed to post comment', 'error');
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
            onDeleted: (deletedId) => {
                comments = comments.filter(c => c.id !== deletedId);
                commentCount_ = Math.max(0, commentCount_ - 1);
            },
        });
    }

    // --- Timestamp ---
    // svelte-ignore state_referenced_locally
    const createdDate = createdAt ? new Date(createdAt) : null;
    function formattedTimestamp() {
        if (!createdDate) return '';
        if (showFullDate) {
            return createdDate.toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit'
            });
        }
        return timeAgo(createdAt);
    }
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
                    <span class="post-location-text">{territoryDisplay}</span>
                {/if}
            </span>
        </div>
        {#if id}
            <button
                class="post-options-btn"
                aria-label="Post options"
                onclick={() => openPostOptionsSheet({ postId: id, dogId, dogSlug, isOwnPost })}
            >
                <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
            </button>
        {/if}
    </div>

    <!-- Post image -->
    <div class="post-image">
        <img
            src={imageUrl}
            srcset="{imageVariant(imageUrl, 'medium')} 600w, {imageUrl} 1200w"
            sizes="(max-width: 540px) 100vw, 500px"
            alt="Post by {username}"
            loading="lazy"
            onerror={(e) => { if (e.target.src !== FALLBACK_POST) e.target.src = FALLBACK_POST; }}
        />
    </div>

    <!-- Actions -->
    <div class="post-actions">
        <button
            class="like-button"
            class:liked={liked}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            onclick={handleLike}
        >
            <i class={liked ? 'fas fa-heart' : 'far fa-heart'} aria-hidden="true"></i>
        </button>
        <span class="like-count">{likes > 0 ? likes : ''}</span>
        <button class="comment-button" aria-label="Comment on post" onclick={handleCommentClick}>
            <i class="far fa-comment" aria-hidden="true"></i>
        </button>
        <span class="comment-count">{commentCount_ > 0 ? commentCount_ : ''}</span>
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
                        ? 'Hide comments'
                        : commentCount_ === 1
                            ? 'View 1 comment'
                            : `View all ${commentCount_} comments`}
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
                                    <span class="comment-time">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <button
                                    type="button"
                                    class="comment-options-btn"
                                    aria-label="Comment options"
                                    onclick={(e) => handleCommentOptions(e, comment)}
                                >
                                    <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
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
                        placeholder="Add a comment..."
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
                    >Post</button>
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
                title={createdDate.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                style="cursor:pointer"
                onclick={() => showFullDate = !showFullDate}
            >{formattedTimestamp()}</time>
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
