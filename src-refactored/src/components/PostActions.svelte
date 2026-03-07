<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        liked = false,
        likes = 0,
        likeInFlight = false,
        commentCount = 0,
        postId = '',
        onLike = null,
        onCommentClick = null,
        onShare = null,
        onLikeCountClick = null,
    } = $props();
</script>

<div class="post-actions">
    <div class="post-actions-left">
        <button
            class="like-button"
            class:liked={liked}
            aria-label={liked ? t('post.unlikePost') : t('post.likePost')}
            onclick={() => onLike?.()}
        >
            <i class={liked ? 'fas fa-heart' : 'far fa-heart'} aria-hidden="true"></i>
        </button>
        <button class="like-count" onclick={() => onLikeCountClick?.()} disabled={likes === 0}>{likes > 0 ? likes : ''}</button>
        <button class="comment-button" aria-label={t('post.commentOnPost')} onclick={() => onCommentClick?.()}>
            <i class="far fa-comment" aria-hidden="true"></i>
        </button>
        <span class="comment-count">{commentCount > 0 ? commentCount : ''}</span>
    </div>
    {#if postId}
        <button class="share-button" aria-label={t('post.sharePost')} onclick={() => onShare?.()}>
            <i class="far fa-paper-plane" aria-hidden="true"></i>
        </button>
    {/if}
</div>

<style>
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
    color: var(--woof-color-neutral-900);
}

.post-actions button.liked i,
.post-actions .like-button.liked i {
    color: var(--woof-color-like);
}

.post-actions .like-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--woof-color-neutral-900);
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
    color: var(--woof-color-neutral-900);
    margin-right: 12px;
    vertical-align: middle;
}

.share-button {
    margin-right: 0;
}
</style>
