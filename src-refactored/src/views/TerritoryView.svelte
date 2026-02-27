<script>
    import { getTerritoryByPath, getTerritoryFeed, getTerritoryDogs } from '../../js/api.js';
    import { imageVariant } from '../../js/utils.js';

    let { params = {} } = $props();

    // Build path from route params (a, b, c)
    let path = $derived([params.a, params.b, params.c].filter(Boolean).join('/'));

    let territory = $state(null);
    let loading = $state(true);
    let loadError = $state(false);
    let activeTab = $state('posts');

    // Posts section (eager load)
    let posts = $state([]);
    let postsLoading = $state(false);
    let postsCursor = $state(null);
    let postsLoadingMore = $state(false);

    // Dogs section (lazy load on tab click)
    let dogs = $state([]);
    let dogsLoading = $state(false);
    let dogsLoadedOnce = $state(false);
    let dogsCursor = $state(null);
    let dogsLoadingMore = $state(false);

    function fallbackImg(e) {
        e.target.src = '/images/dog_profile_pic.jpg';
    }

    // Main init — re-runs when path changes
    $effect(() => {
        const p = path;
        if (!p) return;

        // Reset state
        territory = null;
        loading = true;
        loadError = false;
        activeTab = 'posts';
        posts = [];
        postsLoading = false;
        postsCursor = null;
        dogs = [];
        dogsLoading = false;
        dogsLoadedOnce = false;
        dogsCursor = null;

        let active = true;

        (async () => {
            try {
                const fetched = await getTerritoryByPath(p);
                if (!active) return;
                territory = fetched;
                loading = false;

                // Load posts immediately
                postsLoading = true;
                const feedResult = await getTerritoryFeed(p);
                if (!active) return;
                posts = feedResult.posts || [];
                postsCursor = feedResult.nextCursor;
                postsLoading = false;
            } catch (e) {
                if (!active) return;
                loading = false;
                postsLoading = false;
                loadError = true;
                console.error('Territory load error:', e);
            }
        })();

        return () => { active = false; };
    });

    // Lazy-load dogs tab
    $effect(() => {
        if (activeTab === 'dogs' && !dogsLoadedOnce && !dogsLoading && territory) {
            loadDogs();
        }
    });

    async function loadDogs() {
        if (!territory) return;
        dogsLoading = true;
        try {
            const result = await getTerritoryDogs(path);
            dogs = result.dogs || [];
            dogsCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load territory dogs:', e);
            dogs = [];
        } finally {
            dogsLoading = false;
            dogsLoadedOnce = true;
        }
    }

    async function loadMorePosts() {
        if (!postsCursor || postsLoadingMore) return;
        postsLoadingMore = true;
        try {
            const result = await getTerritoryFeed(path, postsCursor);
            posts = [...posts, ...(result.posts || [])];
            postsCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load more posts:', e);
        } finally {
            postsLoadingMore = false;
        }
    }

    async function loadMoreDogs() {
        if (!dogsCursor || dogsLoadingMore) return;
        dogsLoadingMore = true;
        try {
            const result = await getTerritoryDogs(path, dogsCursor);
            dogs = [...dogs, ...(result.dogs || [])];
            dogsCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load more dogs:', e);
        } finally {
            dogsLoadingMore = false;
        }
    }
</script>

<div class="territory-page">
    {#if loading}
        <div class="territory-hero">
            <div class="territory-hero-gradient"></div>
        </div>
        <div class="territory-sheet">
            <div class="territory-container">
                <div class="skeleton skeleton-text" style="width: 60%; height: 28px; margin-bottom: 12px;"></div>
                <div class="skeleton skeleton-text" style="width: 40%; height: 16px;"></div>
            </div>
        </div>
    {:else if loadError || !territory}
        <div class="territory-sheet" style="margin-top: 0;">
            <div class="territory-container">
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load territory.</p>
                </div>
            </div>
        </div>
    {:else}
        <div class="territory-hero">
            {#if territory.heroImageUrl}
                <img src={territory.heroImageUrl} alt={territory.name} class="territory-hero-img" onerror={fallbackImg} />
            {:else}
                <div class="territory-hero-gradient"></div>
            {/if}
        </div>
        <div class="territory-sheet">
            <div class="territory-container">
                <!-- Breadcrumb navigation -->
                {#if territory.breadcrumb && territory.breadcrumb.length > 1}
                    <nav class="territory-breadcrumb" aria-label="Territory hierarchy">
                        {#each territory.breadcrumb as crumb, i}
                            {#if i > 0}
                                <span class="territory-breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>
                            {/if}
                            {#if i < territory.breadcrumb.length - 1}
                                <a href="/territory/{crumb.urlPath}" data-link class="territory-breadcrumb-link">{crumb.name}</a>
                            {:else}
                                <span class="territory-breadcrumb-current">{crumb.name}</span>
                            {/if}
                        {/each}
                    </nav>
                {/if}

                <div class="territory-sheet-name">{territory.name}</div>
                {#if territory.nameFi && territory.nameFi !== territory.name}
                    <div class="territory-sheet-namefi">{territory.nameFi}</div>
                {/if}

                <div class="territory-sheet-stats">
                    <div class="territory-sheet-stat">
                        <div class="territory-sheet-stat-num">{territory.dogCount}</div>
                        <div class="territory-sheet-stat-label">Dogs</div>
                    </div>
                    <div class="territory-sheet-stat">
                        <div class="territory-sheet-stat-num">{postsLoading ? '—' : posts.length}</div>
                        <div class="territory-sheet-stat-label">Posts</div>
                    </div>
                </div>

                <!-- Child territories (unique to territories) -->
                {#if territory.children && territory.children.length > 0}
                    <div class="territory-children">
                        <h3 class="territory-children-title">
                            {territory.type === 'municipality' ? 'Districts' : 'Neighborhoods'}
                        </h3>
                        <div class="territory-children-grid">
                            {#each territory.children as child}
                                <a href="/territory/{child.urlPath}" data-link class="territory-child-card">
                                    <span class="territory-child-name">{child.name}</span>
                                    {#if child.dogCount > 0}
                                        <span class="territory-child-count">{child.dogCount} <i class="fas fa-dog"></i></span>
                                    {/if}
                                </a>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="profile-tabs" role="tablist">
                <button
                    class="tab-link"
                    class:active={activeTab === 'posts'}
                    role="tab"
                    aria-selected={activeTab === 'posts'}
                    onclick={() => activeTab = 'posts'}
                >
                    <i class="fas fa-th"></i> Posts
                </button>
                <button
                    class="tab-link"
                    class:active={activeTab === 'dogs'}
                    role="tab"
                    aria-selected={activeTab === 'dogs'}
                    onclick={() => activeTab = 'dogs'}
                >
                    <i class="fas fa-dog"></i> Dogs
                </button>
            </div>

            <!-- Posts tab -->
            <div class="tab-content" class:active={activeTab === 'posts'} role="tabpanel" aria-hidden={activeTab !== 'posts'}>
                {#if postsLoading}
                    <div class="territory-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if posts.length === 0}
                    <div class="empty-state">
                        <i class="fas fa-camera"></i>
                        <p>No posts yet in this area.</p>
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
                    {#if postsCursor}
                        <div class="load-more">
                            <button class="btn-secondary" disabled={postsLoadingMore} onclick={loadMorePosts}>
                                {postsLoadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Dogs tab -->
            <div class="tab-content" class:active={activeTab === 'dogs'} role="tabpanel" aria-hidden={activeTab !== 'dogs'}>
                {#if dogsLoading}
                    <div class="territory-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if dogs.length === 0 && dogsLoadedOnce}
                    <div class="empty-state">
                        <i class="fas fa-dog"></i>
                        <p>No dogs registered in this area yet.</p>
                    </div>
                {:else if dogs.length > 0}
                    <ul class="territory-dog-list">
                        {#each dogs as dog (dog.id)}
                            <li class="territory-dog-item">
                                <a href="/dog/{dog.slug || dog.id}" data-link class="territory-dog-link">
                                    <img
                                        src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                                        alt={dog.name}
                                        loading="lazy"
                                        class="territory-dog-avatar"
                                        onerror={fallbackImg}
                                    />
                                    <div class="territory-dog-info">
                                        <span class="territory-dog-name">{dog.name}</span>
                                        {#if dog.breedName}
                                            <span class="territory-dog-breed">{dog.breedName}</span>
                                        {/if}
                                    </div>
                                    <div class="territory-dog-meta">
                                        <span>{dog.postCount || 0} posts</span>
                                    </div>
                                </a>
                            </li>
                        {/each}
                    </ul>
                    {#if dogsCursor}
                        <div class="load-more">
                            <button class="btn-secondary" disabled={dogsLoadingMore} onclick={loadMoreDogs}>
                                {dogsLoadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
.territory-page {
    margin: -20px;
    min-height: 100vh;
}

.territory-hero {
    width: 100%;
    height: 32vh;
    min-height: 160px;
    max-height: 280px;
    overflow: hidden;
    background: var(--woof-color-neutral-200);
    position: relative;
}

.territory-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
}

.territory-hero-gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #4a90a4 0%, #6bb5a0 100%);
}

.territory-sheet {
    background: var(--woof-surface-primary);
    border-radius: var(--woof-radius-2xl) var(--woof-radius-2xl) 0 0;
    margin-top: -28px;
    position: relative;
    z-index: 1;
    padding: 24px 20px 80px;
    min-height: 60vh;
    width: 100%;
    box-sizing: border-box;
}

.territory-container {
    max-width: 640px;
    margin: 0 auto;
}

/* Breadcrumb */
.territory-breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
    font-size: var(--woof-text-caption-1);
}

.territory-breadcrumb-link {
    color: var(--woof-color-brand-primary);
    text-decoration: none;
}

.territory-breadcrumb-link:hover {
    text-decoration: underline;
}

.territory-breadcrumb-sep {
    color: var(--woof-color-neutral-400);
    font-size: 10px;
}

.territory-breadcrumb-current {
    color: var(--woof-color-neutral-500);
}

.territory-sheet-name {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 4px;
}

.territory-sheet-namefi {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-bottom: 12px;
}

.territory-sheet-stats {
    display: flex;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.territory-sheet-stat {
    flex: 1;
    padding-right: 16px;
    margin-right: 16px;
    border-right: 1px solid var(--woof-color-neutral-200);
}

.territory-sheet-stat:last-child {
    border-right: none;
    padding-right: 0;
    margin-right: 0;
}

.territory-sheet-stat-num {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-heavy);
    color: var(--woof-color-neutral-900);
    line-height: 1;
}

.territory-sheet-stat-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 3px;
}

/* Child territories */
.territory-children {
    margin-bottom: 16px;
}

.territory-children-title {
    font-size: var(--woof-text-subheadline);
    font-weight: 600;
    color: var(--woof-color-neutral-700);
    margin-bottom: 8px;
}

.territory-children-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.territory-child-card {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--woof-color-neutral-50);
    border: 1px solid var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-full);
    text-decoration: none;
    color: inherit;
    font-size: var(--woof-text-footnote);
    transition: background 0.15s, border-color 0.15s;
}

.territory-child-card:hover {
    background: var(--woof-color-brand-primary-subtle);
    border-color: var(--woof-color-brand-primary);
}

.territory-child-name {
    font-weight: 500;
    color: var(--woof-color-neutral-800);
}

.territory-child-count {
    color: var(--woof-color-neutral-500);
    font-size: 12px;
}

.territory-child-count i {
    font-size: 10px;
}

/* Posts grid — same as breed page */
.posts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    max-width: 640px;
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

/* Dog list */
.territory-dog-list {
    list-style: none;
    padding: 8px 0;
    margin: 0;
}

.territory-dog-item {
    list-style: none;
}

.territory-dog-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s;
}

.territory-dog-link:hover {
    background-color: var(--color-hover, rgba(0, 0, 0, 0.03));
}

.territory-dog-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.territory-dog-info {
    flex: 1;
    min-width: 0;
}

.territory-dog-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
    display: block;
}

.territory-dog-breed {
    display: block;
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 2px;
}

.territory-dog-meta {
    font-size: 12px;
    color: var(--color-text-muted);
    flex-shrink: 0;
}

.territory-loading {
    text-align: center;
    padding: 32px;
    color: var(--color-text-secondary);
}

.load-more {
    text-align: center;
    padding: 20px 0;
}

@media (max-width: 768px) {
    .territory-page {
        margin: -20px 0 0;
    }
}
</style>
