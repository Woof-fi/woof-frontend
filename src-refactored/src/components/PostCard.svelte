<script>
    import { likePost, unlikePost, createComment, getComments } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, showToast } from '../../js/utils.js';

    let {
        id = '',
        profilePic = '',
        username = '',
        caption = '',
        location = '',
        imageUrl = '',
        dogSlug = '',
        likeCount = 0,
        commentCount = 0,
        likedByUser = false,
        createdAt = null,
        onopenAuthModal = null,
    } = $props();

    // --- Like state ---
    let liked = $state(likedByUser);
    let likes = $state(likeCount);
    let likeInFlight = $state(false);

    // --- Comment state ---
    let commentInput = $state('');
    let comments = $state([]);
    let commentsLoaded = $state(false);
    let commentsVisible = $state(false);
    let commentCount_ = $state(commentCount);
    let submittingComment = $state(false);

    // --- Timestamp toggle ---
    let showFullDate = $state(false);

    const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23cccccc" width="150" height="150"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDog%3C/text%3E%3C/svg%3E';
    const FALLBACK_POST   = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23cccccc" width="400" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';

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

    // --- Timestamp ---
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
            <a href="/dog/{dogSlug}" data-link class="post-author-link">
                <img
                    src={profilePic || FALLBACK_AVATAR}
                    alt="{username}'s profile picture"
                    onerror={(e) => { if (e.target.src !== FALLBACK_AVATAR) e.target.src = FALLBACK_AVATAR; }}
                />
                <strong>{username}</strong>
            </a>
        {:else}
            <img
                src={profilePic || FALLBACK_AVATAR}
                alt="{username}'s profile picture"
                onerror={(e) => { if (e.target.src !== FALLBACK_AVATAR) e.target.src = FALLBACK_AVATAR; }}
            />
            <strong>{username}</strong>
        {/if}
        {#if location}
            <span class="post-location">{location}</span>
        {/if}
    </div>

    <!-- Post image -->
    <div class="post-image">
        <img
            src={imageUrl}
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
            <i class={liked ? 'fas fa-heart' : 'far fa-heart'}></i>
        </button>
        <span class="like-count">{likes > 0 ? likes : ''}</span>
        <button class="comment-button" aria-label="Comment on post" onclick={handleCommentClick}>
            <i class="far fa-comment"></i>
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
                <a class="view-all-comments" href="#" onclick={handleViewComments}>
                    {commentsVisible
                        ? 'Hide comments'
                        : commentCount_ === 1
                            ? 'View 1 comment'
                            : `View all ${commentCount_} comments`}
                </a>
            {/if}

            {#if commentsVisible}
                <div class="comments-list">
                    {#each comments as comment (comment.id)}
                        <div class="comment-item">
                            <a href="/dog/{comment.dogSlug || comment.dogId}" data-link class="comment-author">
                                <strong>{comment.dogName}</strong>
                            </a>
                            <span class="comment-content"> {comment.content}</span>
                            <span class="comment-time">{timeAgo(comment.createdAt)}</span>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if id}
                <div class="comment-form">
                    <input
                        type="text"
                        class="comment-input"
                        placeholder="Add a comment..."
                        maxlength="2200"
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
