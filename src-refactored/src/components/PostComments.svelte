<script>
    import { t } from '../../js/i18n-store.svelte.js';
    import { timeAgo } from '../../js/utils.js';

    let {
        postId = '',
        isAuthenticated = false,
        commentCount = 0,
        comments = [],
        commentsVisible = false,
        commentsLoaded = false,
        commentInput = $bindable(''),
        submittingComment = false,
        onViewComments = null,
        onSubmitComment = null,
        onCommentKeydown = null,
        onCommentOptionsClick = null,
    } = $props();
</script>

<div class="post-comments-section">
    {#if isAuthenticated}
        {#if commentCount > 0 && postId}
            <button class="view-all-comments" onclick={(e) => onViewComments?.(e)}>
                {commentsVisible
                    ? t('post.hideComments')
                    : commentCount === 1
                        ? t('post.viewOneComment')
                        : t('post.viewComments', { count: commentCount })}
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
                                onclick={(e) => onCommentOptionsClick?.(e, comment)}
                            >
                                <i class="fas fa-ellipsis" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        {#if postId}
            <div class="comment-form">
                <input
                    type="text"
                    name="comment"
                    class="comment-input"
                    placeholder={t('post.addComment')}
                    maxlength="2200"
                    autocomplete="off"
                    data-comment-input={postId}
                    bind:value={commentInput}
                    onkeydown={(e) => onCommentKeydown?.(e)}
                />
                <button
                    class="comment-submit"
                    disabled={!commentInput.trim() || submittingComment}
                    onclick={() => onSubmitComment?.()}
                >{t('post.postComment')}</button>
            </div>
        {/if}
    {/if}
</div>

<style>
.post-comments-section {
    padding: 0 10px 8px;
}

.view-all-comments {
    display: block;
    color: var(--woof-color-neutral-400);
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
    color: var(--woof-color-neutral-900);
}

.comment-content {
    color: var(--woof-color-neutral-900);
}

.comment-time {
    display: block;
    font-size: 11px;
    color: var(--woof-color-neutral-400);
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
    border-top: 1px solid var(--woof-color-neutral-200);
    padding-top: 8px;
}

.comment-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    color: var(--woof-color-neutral-900);
    padding: 4px 0;
}

.comment-input::placeholder {
    color: var(--woof-color-neutral-400);
}

.comment-submit {
    background: none;
    border: none;
    color: var(--woof-color-brand-primary);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 0;
}

.comment-submit:disabled {
    opacity: 0.4;
    cursor: default;
}

.comment-options-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--woof-color-neutral-400);
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
    color: var(--woof-color-neutral-900);
}

@media (hover: hover) {
    .comment-options-btn {
        opacity: 0;
    }
    .comment-item:hover .comment-options-btn {
        opacity: 1;
    }
}
</style>
