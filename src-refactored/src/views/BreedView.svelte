<script>
    import { getBreedBySlug, getBreedFeed, getBreedDogs, followBreed, unfollowBreed } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast, imageVariant } from '../../js/utils.js';
    import { store, bumpBreedVersion } from '../../js/svelte-store.svelte.js';
    import { t, localName, locale } from '../../js/i18n-store.svelte.js';

    let { params = {} } = $props();
    let slug = $derived(params.slug);

    let breed = $state(null);
    let loading = $state(true);
    let loadError = $state(false);
    let activeTab = $state('posts');

    // Persist active tab in sessionStorage so back-navigation restores it
    const TAB_KEY = 'woof_tab_positions';
    function saveTab(tab) {
        try {
            const tabs = JSON.parse(sessionStorage.getItem(TAB_KEY) || '{}');
            tabs['/breed/' + slug] = tab;
            sessionStorage.setItem(TAB_KEY, JSON.stringify(tabs));
        } catch { /* ignore */ }
    }
    function restoreTab() {
        try {
            const tabs = JSON.parse(sessionStorage.getItem(TAB_KEY) || '{}');
            return tabs['/breed/' + slug] || 'posts';
        } catch { return 'posts'; }
    }
    function setTab(tab) {
        activeTab = tab;
        saveTab(tab);
    }

    let posts = $state([]);
    let postsLoading = $state(false);
    let postsCursor = $state(null);
    let postsLoadingMore = $state(false);

    let dogs = $state([]);
    let dogsLoading = $state(false);
    let dogsLoadedOnce = $state(false);
    let dogsCursor = $state(null);
    let dogsLoadingMore = $state(false);

    let isFollowing = $state(false);
    let followLoading = $state(false);

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }

    // Main init — re-runs when slug changes
    $effect(() => {
        const s = slug;
        if (!s) return;

        // Reset state
        breed = null;
        loading = true;
        loadError = false;
        activeTab = restoreTab();
        posts = [];
        postsLoading = false;
        postsCursor = null;
        dogs = [];
        dogsLoading = false;
        dogsLoadedOnce = false;
        dogsCursor = null;
        isFollowing = false;
        followLoading = false;

        let active = true;

        (async () => {
            try {
                const fetchedBreed = await getBreedBySlug(s);
                if (!active) return;
                breed = fetchedBreed;
                isFollowing = fetchedBreed.isFollowing || false;
                loading = false;

                // Load posts immediately
                postsLoading = true;
                const feedResult = await getBreedFeed(s);
                if (!active) return;
                posts = feedResult.posts || [];
                postsCursor = feedResult.nextCursor;
                postsLoading = false;
            } catch (e) {
                if (!active) return;
                loading = false;
                postsLoading = false;
                loadError = true;
                console.error('Breed load error:', e);
            }
        })();

        return () => { active = false; };
    });

    // Lazy-load dogs tab
    $effect(() => {
        if (activeTab === 'dogs' && !dogsLoadedOnce && !dogsLoading && breed) {
            loadDogs();
        }
    });

    async function loadDogs() {
        if (!breed) return;
        dogsLoading = true;
        try {
            const result = await getBreedDogs(slug);
            dogs = result.dogs || [];
            dogsCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load breed dogs:', e);
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
            const result = await getBreedFeed(slug, postsCursor);
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
            const result = await getBreedDogs(slug, dogsCursor);
            dogs = [...dogs, ...(result.dogs || [])];
            dogsCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load more dogs:', e);
        } finally {
            dogsLoadingMore = false;
        }
    }

    async function handleFollowToggle() {
        if (!isAuthenticated()) {
            showToast(t('breed.loginToFollow'), 'error');
            return;
        }
        followLoading = true;
        try {
            if (isFollowing) {
                await unfollowBreed(slug);
                isFollowing = false;
                breed = { ...breed, followerCount: Math.max(0, breed.followerCount - 1) };
            } else {
                await followBreed(slug);
                isFollowing = true;
                breed = { ...breed, followerCount: breed.followerCount + 1 };
            }
            bumpBreedVersion();
        } catch (e) {
            console.error('Breed follow toggle failed:', e);
            showToast(t('breed.actionFailed'), 'error');
        } finally {
            followLoading = false;
        }
    }
</script>

<div class="breed-page">
    {#if loading}
        <div class="breed-hero"></div>
        <div class="breed-sheet">
            <div class="breed-container">
                <div class="profile-skeleton">
                    <div class="skeleton-details">
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text" style="width:60%"></div>
                    </div>
                </div>
            </div>
        </div>
    {:else if loadError || !breed}
        <div class="breed-sheet">
            <div class="breed-container">
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon woof-empty-state-icon--error">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <p>{t('breed.failedLoad')}</p>
                </div>
            </div>
        </div>
    {:else}
        <div class="breed-hero">
            {#if breed.photo}
                <img src={breed.photo} alt={localName(breed)} class="breed-hero-img" onerror={fallbackImg} />
            {:else if breed.heroImageUrl}
                <img src={breed.heroImageUrl} alt={localName(breed)} class="breed-hero-img" onerror={fallbackImg} />
            {:else}
                <div class="breed-hero-gradient"></div>
            {/if}
        </div>
        <div class="breed-sheet">
            <div class="breed-container">
                <div class="breed-sheet-namerow">
                    <div>
                        <div class="breed-sheet-name">{localName(breed)}</div>
                    </div>
                    <button
                        class="follow-btn"
                        class:following={isFollowing}
                        disabled={followLoading}
                        onclick={handleFollowToggle}
                    >
                        {#if isFollowing}
                            <i class="fas fa-check"></i> {t('breed.following')}
                        {:else}
                            <i class="fas fa-plus"></i> {t('breed.follow')}
                        {/if}
                    </button>
                </div>
                {#if breed.description}
                    <p class="breed-sheet-desc">{breed.description}</p>
                {/if}
                <div class="breed-sheet-stats">
                    <div class="breed-sheet-stat">
                        <div class="breed-sheet-stat-num">{breed.dogCount}</div>
                        <div class="breed-sheet-stat-label">{t('breed.dogs')}</div>
                    </div>
                    <div class="breed-sheet-stat">
                        <div class="breed-sheet-stat-num">{breed.followerCount}</div>
                        <div class="breed-sheet-stat-label">{t('breed.followers')}</div>
                    </div>
                    <div class="breed-sheet-stat">
                        <div class="breed-sheet-stat-num">{postsLoading ? '—' : posts.length}</div>
                        <div class="breed-sheet-stat-label">{t('breed.posts')}</div>
                    </div>
                </div>
            </div>

            <div class="profile-tabs" role="tablist">
                <button
                    class="tab-link"
                    class:active={activeTab === 'posts'}
                    role="tab"
                    aria-selected={activeTab === 'posts'}
                    onclick={() => setTab('posts')}
                >
                    <i class="fas fa-th"></i> {t('breed.posts')}
                </button>
                <button
                    class="tab-link"
                    class:active={activeTab === 'dogs'}
                    role="tab"
                    aria-selected={activeTab === 'dogs'}
                    onclick={() => setTab('dogs')}
                >
                    <i class="fas fa-dog"></i> {t('breed.dogs')}
                </button>
            </div>

            <!-- Posts tab -->
            <div class="tab-content" class:active={activeTab === 'posts'} role="tabpanel" aria-hidden={activeTab !== 'posts'}>
                {#if postsLoading}
                    <div class="breed-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if posts.length === 0}
                    <div class="woof-empty-state">
                        <div class="woof-empty-state-icon">
                            <i class="fas fa-camera"></i>
                        </div>
                        <p>{t('breed.noPosts')}</p>
                    </div>
                {:else}
                    <div class="posts-grid posts-grid-2col">
                        {#each posts as post (post.id)}
                            <a href="/post/{post.id}" data-link class="posts-grid-item">
                                <img
                                    src={post.imageUrl}
                                    srcset="{imageVariant(post.imageUrl, 'medium')} 600w, {post.imageUrl} 1200w"
                                    sizes="(max-width: 640px) calc(50vw - 16px), 310px"
                                    alt={post.caption || t('breed.postImage')}
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
                                {postsLoadingMore ? t('common.loadingEllipsis') : t('breed.loadMore')}
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Dogs tab -->
            <div class="tab-content" class:active={activeTab === 'dogs'} role="tabpanel" aria-hidden={activeTab !== 'dogs'}>
                {#if dogsLoading}
                    <div class="breed-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if dogs.length === 0 && dogsLoadedOnce}
                    <div class="woof-empty-state">
                        <div class="woof-empty-state-icon">
                            <i class="fas fa-dog"></i>
                        </div>
                        <p>{t('breed.noDogs')}</p>
                    </div>
                {:else if dogs.length > 0}
                    <ul class="breed-dog-list">
                        {#each dogs as dog (dog.id)}
                            <li class="breed-dog-item">
                                <a href="/dog/{dog.slug || dog.id}" data-link class="breed-dog-link">
                                    <img
                                        src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                                        alt={dog.name}
                                        loading="lazy"
                                        class="breed-dog-avatar"
                                        onerror={fallbackImg}
                                    />
                                    <div class="breed-dog-info">
                                        <span class="breed-dog-name">{dog.name}</span>
                                        {#if dog.territoryName}
                                            {@const territoryText = dog.territoryType === 'sub_district' && dog.territoryParentName
                                                ? `${dog.territoryName}, ${dog.territoryParentName}`
                                                : dog.territoryName}
                                            {#if dog.territoryUrlPath}
                                                <span class="breed-dog-location breed-dog-territory-link" role="link" tabindex="0" onclick={(e) => { e.preventDefault(); e.stopPropagation(); history.pushState({}, '', `/territory/${dog.territoryUrlPath}`); window.dispatchEvent(new CustomEvent('routechange')); }} onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); history.pushState({}, '', `/territory/${dog.territoryUrlPath}`); window.dispatchEvent(new CustomEvent('routechange')); } }}><i class="fas fa-map-marker-alt"></i> {territoryText}</span>
                                            {:else}
                                                <span class="breed-dog-location"><i class="fas fa-map-marker-alt"></i> {territoryText}</span>
                                            {/if}
                                        {/if}
                                    </div>
                                    <div class="breed-dog-meta">
                                        <span>{t('breed.postCount', { count: dog.postCount || 0 })}</span>
                                    </div>
                                </a>
                            </li>
                        {/each}
                    </ul>
                    {#if dogsCursor}
                        <div class="load-more">
                            <button class="btn-secondary" disabled={dogsLoadingMore} onclick={loadMoreDogs}>
                                {dogsLoadingMore ? t('common.loadingEllipsis') : t('breed.loadMore')}
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
.breed-page {
    margin: -20px;
    min-height: 100vh;
}

.breed-hero {
    width: 100%;
    height: 32vh;
    min-height: 160px;
    max-height: 280px;
    overflow: hidden;
    background: var(--woof-color-neutral-200);
    position: relative;
}

.breed-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
}

.breed-hero-gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--woof-color-brand-primary) 0%, #e67373 100%);
}

.breed-sheet {
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

.breed-container {
    max-width: 640px;
    margin: 0 auto;
}

.breed-sheet-namerow {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 12px;
}

.breed-sheet-name {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    letter-spacing: -0.5px;
    line-height: 1.1;
}

.breed-sheet-desc {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-700);
    line-height: 1.5;
    margin-bottom: 16px;
}

.breed-sheet-stats {
    display: flex;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.breed-sheet-stat {
    flex: 1;
    padding-right: 16px;
    margin-right: 16px;
    border-right: 1px solid var(--woof-color-neutral-200);
}

.breed-sheet-stat:last-child {
    border-right: none;
    padding-right: 0;
    margin-right: 0;
}

.breed-sheet-stat-num {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-heavy);
    color: var(--woof-color-neutral-900);
    line-height: 1;
}

.breed-sheet-stat-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 3px;
}

/* Follow button — reuse profile pattern */
.follow-btn {
    padding: 8px 20px;
    border: none;
    border-radius: var(--woof-btn-radius);
    background: var(--color-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-subheadline);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--woof-duration-fast);
    flex-shrink: 0;
}

.follow-btn:hover {
    background: var(--color-primary-hover);
}

.follow-btn.following {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.follow-btn.following:hover {
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary);
    border-color: var(--woof-color-brand-primary);
}

.follow-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Posts grid — reuse profile pattern */
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
.breed-dog-list {
    list-style: none;
    padding: 8px 0;
    margin: 0;
}

.breed-dog-item {
    list-style: none;
}

.breed-dog-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s;
}

.breed-dog-link:hover {
    background-color: var(--color-hover, rgba(0, 0, 0, 0.03));
}

.breed-dog-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.breed-dog-info {
    flex: 1;
    min-width: 0;
}

.breed-dog-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
    display: block;
}

.breed-dog-location {
    display: block;
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 2px;
    text-decoration: none;
}

.breed-dog-territory-link {
    cursor: pointer;
}

.breed-dog-territory-link:hover {
    text-decoration: underline;
}

.breed-dog-location i {
    font-size: 11px;
    margin-right: 2px;
}

.breed-dog-meta {
    font-size: 12px;
    color: var(--color-text-muted);
    flex-shrink: 0;
}

.breed-loading {
    text-align: center;
    padding: 32px;
    color: var(--color-text-secondary);
}

.load-more {
    text-align: center;
    padding: 20px 0;
}

@media (max-width: 768px) {
    .breed-page {
        margin: -20px 0 0;
    }
}
</style>
