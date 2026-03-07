<script>
    import { imageVariant } from '../../js/utils.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        posts = [],
        loading = false,
        hasMore = false,
        loadingMore = false,
        emptyMessage = '',
        onLoadMore = null,
    } = $props();

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }
</script>

{#if loading}
    <div class="posts-loading"><i class="fas fa-spinner fa-spin"></i></div>
{:else if posts.length === 0}
    <div class="woof-empty-state">
        <div class="woof-empty-state-icon">
            <i class="fas fa-camera"></i>
        </div>
        <p>{emptyMessage || t('profile.noPosts')}</p>
    </div>
{:else}
    <div class="posts-grid posts-grid-2col">
        {#each posts as post (post.id)}
            <a href="/post/{post.id}" data-link class="posts-grid-item">
                <img
                    src={post.imageUrl}
                    srcset="{imageVariant(post.imageUrl, 'medium')} 600w, {post.imageUrl} 1200w"
                    sizes="(max-width: 640px) calc(50vw - 16px), 310px"
                    alt={post.caption || 'Post image'}
                    loading="lazy"
                    onerror={fallbackImg}
                />
                <div class="posts-grid-overlay">
                    <span><i class="fas fa-heart"></i> {post.likeCount || 0}</span>
                </div>
            </a>
        {/each}
    </div>
    {#if hasMore}
        <button
            class="load-more-btn"
            onclick={onLoadMore}
            disabled={loadingMore}
        >
            {#if loadingMore}
                <i class="fas fa-spinner fa-spin"></i> {t('common.loading')}
            {:else}
                {t('profile.loadMore')}
            {/if}
        </button>
    {/if}
{/if}

<style>
.posts-loading {
    text-align: center;
    padding: var(--woof-space-8);
    color: var(--woof-color-neutral-500);
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    max-width: 600px;
    margin: 0 auto;
}

.posts-grid-2col {
    grid-template-columns: repeat(2, 1fr);
    gap: 3px;
}

.posts-grid-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    display: block;
    text-decoration: none;
    color: inherit;
}

.posts-grid-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.posts-grid-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.posts-grid-item:hover .posts-grid-overlay {
    opacity: 1;
}

.posts-grid-overlay span {
    color: #fff;
    font-weight: 600;
    font-size: 14px;
}

.posts-grid-overlay span i {
    margin-right: 4px;
}

.load-more-btn {
    display: block;
    width: 100%;
    padding: var(--woof-space-md) var(--woof-space-lg);
    margin-top: var(--woof-space-md);
    background: var(--woof-color-surface);
    color: var(--woof-color-brand-primary);
    border: 1px solid var(--woof-color-brand-primary);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-font-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}
.load-more-btn:hover:not(:disabled) {
    background: var(--woof-color-brand-primary);
    color: white;
}
.load-more-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
