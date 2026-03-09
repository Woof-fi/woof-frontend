<script>
    import { getBookmarkedPosts, getMyDogs } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import PostCard from '../components/PostCard.svelte';
    import { viewport } from '../actions/viewport.ts';

    let { onopenAuthModal = null } = $props();

    let posts = $state([]);
    let nextCursor = $state(null);
    let loading = $state(true);
    let myDogs = $state([]);

    async function loadMore() {
        if (loading || !nextCursor) return;
        loading = true;
        try {
            const result = await getBookmarkedPosts(nextCursor);
            posts = [...posts, ...(result.posts || [])];
            nextCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load more bookmarks:', e);
            showToast(t('common.failedLoad'), 'error');
        } finally {
            loading = false;
        }
    }

    // Load bookmarks — re-runs on auth changes
    $effect(() => {
        const authUser = store.authUser;
        let cleanup = false;

        async function init() {
            loading = true;
            posts = [];
            nextCursor = null;
            myDogs = [];

            if (!authUser) {
                loading = false;
                return;
            }

            try {
                const [bookmarksResult, dogsResult] = await Promise.all([
                    getBookmarkedPosts(),
                    getMyDogs().catch(() => []),
                ]);
                if (!cleanup) {
                    posts = bookmarksResult.posts || [];
                    nextCursor = bookmarksResult.nextCursor;
                    myDogs = dogsResult;
                }
            } catch (e) {
                console.error('Failed to load bookmarks:', e);
                showToast(t('common.failedLoad'), 'error');
            } finally {
                if (!cleanup) loading = false;
            }
        }

        init();

        return () => { cleanup = true; };
    });
</script>

<main class="bookmarks-page">
    <div class="bookmarks-header">
        <h1>{t('bookmarks.title')}</h1>
    </div>

    {#if !isAuthenticated()}
        <div class="bookmarks-empty">
            <div class="bookmarks-empty-icon">
                <i class="fas fa-bookmark"></i>
            </div>
            <h2 class="bookmarks-empty-title">{t('bookmarks.emptyAuthTitle')}</h2>
            <p class="bookmarks-empty-desc">{t('bookmarks.emptyAuthDesc')}</p>
            <button class="bookmarks-empty-btn" onclick={() => onopenAuthModal?.()}>{t('bookmarks.signIn')}</button>
        </div>
    {:else if loading && posts.length === 0}
        <div class="bookmarks-loading"><i class="fas fa-spinner fa-spin"></i></div>
    {:else if posts.length === 0}
        <div class="bookmarks-empty">
            <div class="bookmarks-empty-icon">
                <i class="far fa-bookmark"></i>
            </div>
            <h2 class="bookmarks-empty-title">{t('bookmarks.emptyTitle')}</h2>
            <p class="bookmarks-empty-desc">{t('bookmarks.emptyDesc')}</p>
            <a href="/" class="bookmarks-empty-btn" data-link>{t('bookmarks.browseFeed')}</a>
        </div>
    {:else}
        {#each posts as item (item.id)}
            <PostCard
                id={item.id}
                profilePic={item.dogPhoto || '/images/dog_profile_pic.jpg'}
                username={item.dogName || t('feed.unknownDog')}
                imageUrl={item.imageUrl}
                imageUrls={item.imageUrls || []}
                caption={item.caption || ''}
                dogSlug={item.dogSlug || ''}
                dogId={item.dogId || ''}
                isOwnPost={myDogs.some(d => d.id === item.dogId)}
                likeCount={item.likeCount || 0}
                commentCount={item.commentCount || 0}
                likedByUser={item.likedByUser || false}
                createdAt={item.createdAt}
                updatedAt={item.updatedAt || null}
                breedName={item.breedName || ''}
                breedSlug={item.breedSlug || ''}
                territoryName={item.territoryName || ''}
                territoryType={item.territoryType || ''}
                territoryParentName={item.territoryParentName || ''}
                territoryGrandparentName={item.territoryGrandparentName || ''}
                territoryUrlPath={item.territoryUrlPath || ''}
                parkName={item.parkName || ''}
                parkNameFi={item.parkNameFi || ''}
                parkSlug={item.parkSlug || ''}
                taggedDogs={item.taggedDogs || []}
                onopenAuthModal={onopenAuthModal}
            />
        {/each}

        {#if nextCursor}
            <div use:viewport={loadMore} class="bookmarks-sentinel">
                {#if loading}
                    <i class="fas fa-spinner fa-spin"></i>
                {/if}
            </div>
        {/if}
    {/if}
</main>

<style>
.bookmarks-page {
    max-width: 600px;
    margin: 0 auto;
}

.bookmarks-header {
    padding: var(--woof-space-3) var(--woof-space-4) var(--woof-space-2);
}

.bookmarks-header h1 {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    margin: 0;
}

/* Empty state */
.bookmarks-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--woof-space-8) var(--woof-space-6);
    margin-top: var(--woof-space-6);
}

.bookmarks-empty-icon {
    width: 80px;
    height: 80px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-neutral-100);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--woof-space-4);
}

.bookmarks-empty-icon i {
    font-size: var(--woof-text-title-1);
    color: var(--woof-color-neutral-400);
}

.bookmarks-empty-title {
    font-size: var(--woof-text-title-3);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 var(--woof-space-2) 0;
}

.bookmarks-empty-desc {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-500);
    margin: 0 0 var(--woof-space-5) 0;
    max-width: 280px;
    line-height: 1.5;
}


.bookmarks-empty-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--woof-space-2) var(--woof-space-5);
    background: var(--woof-color-brand-primary);
    color: white;
    border: none;
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    text-decoration: none;
    transition: opacity 0.15s ease;
}

.bookmarks-empty-btn:hover {
    opacity: 0.9;
}

/* Loading */
.bookmarks-loading {
    text-align: center;
    padding: var(--woof-space-8);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-title-2);
}

.bookmarks-sentinel {
    display: flex;
    justify-content: center;
    padding: var(--woof-space-4) 0;
    font-size: var(--woof-text-title-2);
    color: var(--woof-color-neutral-400);
}
</style>
