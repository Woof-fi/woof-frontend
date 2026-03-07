<script>
    import { getFeed, getMyDogs, getAllDogs, getFollowingVisits, getNewDogsInFollowedAreas } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { openCreateDogModal } from '../../js/modal-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import { store, setFeedTab } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import PostCard from './PostCard.svelte';
    import InviteCard from './InviteCard.svelte';
    import ParkVisitCard from './ParkVisitCard.svelte';
    import NewDogCard from './NewDogCard.svelte';
    import { viewport } from '../actions/viewport.ts';

    let { type = 'public', onopenAuthModal = null } = $props();

    let posts = $state([]);
    let nextCursor = $state(null);
    let loading = $state(true);
    let myDogs = $state([]);
    let followingVisits = $state([]);
    let followingNewDogs = $state([]);
    let refreshing = $state(false);
    let pullDistance = $state(0);
    let feedEl;

    let isFollowingFeed = $derived(type === 'following' && isAuthenticated());

    const INVITE_FIRST_POSITION = 5;
    const INVITE_INTERVAL = 20;
    const GATE_POST_LIMIT = 4;

    // Build array with invite cards inserted at correct positions
    let postsWithItems = $derived.by(() => {
        if (!isAuthenticated()) return posts;
        const result = [];
        let position = 0;
        for (const post of posts) {
            position++;
            result.push(post);
            if (position === INVITE_FIRST_POSITION) {
                result.push({ type: 'invite', _key: `invite-${position}` });
            } else if (position > INVITE_FIRST_POSITION && (position - INVITE_FIRST_POSITION) % INVITE_INTERVAL === 0) {
                result.push({ type: 'invite', _key: `invite-${position}` });
            }
        }
        return result;
    });

    // Content gate: show only first 4 posts then gate
    let visibleItems = $derived.by(() => {
        if (!isAuthenticated() && posts.length > GATE_POST_LIMIT) {
            return postsWithItems.filter(item => item.type !== 'invite').slice(0, GATE_POST_LIMIT);
        }
        return postsWithItems;
    });

    let showContentGate = $derived(!isAuthenticated() && posts.length > GATE_POST_LIMIT);

    async function loadMore() {
        if (loading || !nextCursor) return;
        loading = true;
        try {
            const result = await getFeed(type, nextCursor);
            posts = [...posts, ...(result.posts || [])];
            nextCursor = result.nextCursor;
        } catch (e) {
            console.error('Failed to load more posts:', e);
            showToast(t('common.failedLoad'), 'error');
        } finally {
            loading = false;
        }
    }

    async function refreshFeed() {
        if (refreshing || loading) return;
        refreshing = true;
        try {
            const isFollowing = type === 'following' && isAuthenticated();
            // Minimum 500ms spinner so the user sees feedback
            const [feedResult, dogsResult, visitsResult, newDogsResult] = await Promise.all([
                getFeed(type),
                isAuthenticated() ? getMyDogs().catch(() => []) : Promise.resolve([]),
                isFollowing ? getFollowingVisits().catch(() => []) : Promise.resolve([]),
                isFollowing ? getNewDogsInFollowedAreas().catch(() => []) : Promise.resolve([]),
                new Promise(r => setTimeout(r, 500)),
            ]);
            posts = feedResult.posts || [];
            nextCursor = feedResult.nextCursor;
            myDogs = dogsResult;
            followingVisits = visitsResult;
            followingNewDogs = newDogsResult;
        } catch (e) {
            console.error('Failed to refresh feed:', e);
            showToast(t('feed.refreshFailed'), 'error');
        } finally {
            refreshing = false;
        }
    }

    // --- Pull-to-refresh (touch only) ---
    const PULL_THRESHOLD = 60;
    let touchStartY = 0;
    let isPulling = false;

    function handleTouchStart(e) {
        if (window.scrollY === 0 && !refreshing && !loading) {
            touchStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }

    function handleTouchMove(e) {
        if (!isPulling) return;
        const delta = e.touches[0].clientY - touchStartY;
        if (delta > 0 && window.scrollY === 0) {
            pullDistance = Math.min(delta * 0.4, 100);
        } else {
            pullDistance = 0;
        }
    }

    function handleTouchEnd() {
        if (!isPulling) return;
        isPulling = false;
        if (pullDistance >= PULL_THRESHOLD) {
            refreshFeed();
        }
        pullDistance = 0;
    }

    function handleOpenAuthModal() {
        onopenAuthModal?.();
    }

    function handleAddDog() {
        openCreateDogModal();
    }

    // Mount effect — load feed, re-run on auth/feed version changes
    $effect(() => {
        // All three values must be read AND used to prevent DCE and ensure Svelte
        // registers them as reactive dependencies.
        const currentType = type;
        const authUser = store.authUser;       // used below: re-fetch on login/logout
        void store.feedVersion;                // void: preserves reactive read, triggers re-fetch on new post

        let observer = null;
        let cleanup = false;

        async function init() {
            loading = true;
            posts = [];
            nextCursor = null;
            myDogs = [];
            followingVisits = [];
            followingNewDogs = [];

            const isFollowing = currentType === 'following' && !!authUser;

            try {
                const [feedResult, dogsResult, visitsResult, newDogsResult] = await Promise.all([
                    getFeed(currentType),
                    authUser ? getMyDogs().catch(() => []) : Promise.resolve([]),
                    isFollowing ? getFollowingVisits().catch(() => []) : Promise.resolve([]),
                    isFollowing ? getNewDogsInFollowedAreas().catch(() => []) : Promise.resolve([]),
                ]);
                if (!cleanup) {
                    const feedPosts = feedResult.posts || [];

                    // Auto-fallback: if following feed is completely empty, switch to Discover
                    if (isFollowing && feedPosts.length === 0 && visitsResult.length === 0 && newDogsResult.length === 0) {
                        setFeedTab('public');
                        return; // The reactive effect will re-run with 'public' type
                    }

                    posts = feedPosts;
                    nextCursor = feedResult.nextCursor;
                    myDogs = dogsResult;
                    followingVisits = visitsResult;
                    followingNewDogs = newDogsResult;
                }
            } catch (e) {
                console.error('Failed to load feed:', e);
                showToast(t('common.failedLoad'), 'error');
            } finally {
                if (!cleanup) loading = false;
            }
        }

        init();

        return () => {
            cleanup = true;
            if (observer) observer.disconnect();
        };
    });

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="feed-wrapper"
    bind:this={feedEl}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
>
    <!-- Pull-to-refresh indicator -->
    {#if pullDistance > 0 || refreshing}
        <div class="pull-to-refresh" style="height: {refreshing ? 48 : pullDistance}px">
            <div class="pull-to-refresh-inner" class:ready={pullDistance >= PULL_THRESHOLD} class:refreshing>
                {#if refreshing}
                    <i class="fas fa-spinner fa-spin"></i>
                    <span class="pull-to-refresh-label">{t('feed.refreshing')}</span>
                {:else if pullDistance >= PULL_THRESHOLD}
                    <i class="fas fa-arrow-down" style="transform: rotate(180deg); transition: transform 0.2s"></i>
                    <span class="pull-to-refresh-label">{t('feed.releaseToRefresh')}</span>
                {:else}
                    <i class="fas fa-arrow-down" style="transition: transform 0.2s"></i>
                    <span class="pull-to-refresh-label">{t('feed.pullToRefresh')}</span>
                {/if}
            </div>
        </div>
    {/if}

{#if loading && posts.length === 0}
    <div class="post-skeleton" aria-hidden="true">
        <div class="post-header-skeleton">
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
        <div class="skeleton skeleton-image"></div>
        <div class="post-actions-skeleton">
            <div class="skeleton skeleton-text"></div>
        </div>
    </div>
    <div class="post-skeleton" aria-hidden="true">
        <div class="post-header-skeleton">
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
        <div class="skeleton skeleton-image"></div>
        <div class="post-actions-skeleton">
            <div class="skeleton skeleton-text"></div>
        </div>
    </div>
    <div class="post-skeleton" aria-hidden="true">
        <div class="post-header-skeleton">
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
        <div class="skeleton skeleton-image"></div>
        <div class="post-actions-skeleton">
            <div class="skeleton skeleton-text"></div>
        </div>
    </div>
{:else if !loading && posts.length === 0 && followingVisits.length === 0 && followingNewDogs.length === 0 && type === 'following'}
    {#if isAuthenticated()}
        <div class="woof-empty-state">
            <div class="woof-empty-state-icon">
                <i class="fas fa-user-friends"></i>
            </div>
            <p>{t('feed.followingEmpty')}</p>
            <p>{t('feed.followingEmptyHint', { tab: t('nav.forYou') })}</p>
        </div>
    {:else}
        <div class="woof-empty-state">
            <div class="woof-empty-state-icon">
                <i class="fas fa-user-friends"></i>
            </div>
            <p>{t('feed.followingSignUp')}</p>
        </div>
    {/if}
{:else}
    {#if isAuthenticated() && myDogs.length === 0 && !loading}
        <div class="welcome-card">
            <div class="welcome-card-icon"><i class="fas fa-paw"></i></div>
            <h2>{t('feed.welcomeTitle')}</h2>
            <p>{t('feed.welcomeDesc')}</p>
            <button class="btn-primary welcome-card-btn" onclick={handleAddDog}>
                <i class="fas fa-plus"></i> {t('feed.addYourDog')}
            </button>
        </div>
    {/if}

    {#if isFollowingFeed && followingVisits.length > 0}
        <div class="following-section">
            <h3 class="following-section-title">
                <i class="fas fa-walking"></i> {t('feed.upcomingVisits')}
            </h3>
            {#each followingVisits as visit (visit.id)}
                <ParkVisitCard {visit} />
            {/each}
        </div>
    {/if}

    {#if isFollowingFeed && followingNewDogs.length > 0}
        <div class="following-section">
            <h3 class="following-section-title">
                <i class="fas fa-paw"></i> {t('feed.newInYourArea')}
            </h3>
            {#each followingNewDogs as dog (dog.id)}
                <NewDogCard {dog} />
            {/each}
        </div>
    {/if}

    {#each visibleItems as item (item.id ?? item._key ?? item)}
        {#if item.type === 'invite'}
            <InviteCard />
        {:else}
            <PostCard
                id={item.id}
                profilePic={item.dogPhoto || '/images/dog_profile_pic.jpg'}
                username={item.dogName || t('feed.unknownDog')}
                imageUrl={item.imageUrl}
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
                onopenAuthModal={handleOpenAuthModal}
            />
        {/if}
    {/each}

    {#if showContentGate}
        <div class="content-gate">
            <div class="content-gate-overlay">
                <div class="content-gate-content">
                    <div class="content-gate-icon"><i class="fas fa-lock"></i></div>
                    <h2 class="content-gate-heading">{t('feed.gateTitle')}</h2>
                    <p class="content-gate-desc">{t('feed.gateDesc')}</p>
                    <div class="content-gate-buttons">
                        <button class="btn-primary content-gate-btn" onclick={handleOpenAuthModal}>{t('auth.signUp')}</button>
                        <button class="btn-secondary content-gate-btn" onclick={handleOpenAuthModal}>{t('auth.signIn')}</button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {#if nextCursor && !showContentGate}
        <div use:viewport={loadMore} class="feed-sentinel">
            {#if loading}
                <i class="fas fa-spinner fa-spin"></i>
            {/if}
        </div>
    {/if}
{/if}
</div>

<style>
.feed-wrapper {
    touch-action: pan-y;
}

.pull-to-refresh {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
    transition: height var(--woof-duration-fast) var(--woof-ease-out);
}

.pull-to-refresh-inner {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2);
    font-size: 16px;
    color: var(--woof-color-neutral-400);
    transition: color var(--woof-duration-fast);
}

.pull-to-refresh-inner.ready {
    color: var(--woof-color-brand-primary);
}

.pull-to-refresh-inner.refreshing {
    color: var(--woof-color-brand-primary);
}

.pull-to-refresh-label {
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
}

.following-section {
    margin-bottom: var(--woof-space-4);
}

.following-section-title {
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 var(--woof-space-3);
    padding: 0 var(--woof-space-2);
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
}

.feed-sentinel {
    display: flex;
    justify-content: center;
    padding: 20px 0;
    font-size: 24px;
    color: var(--text-secondary, #888);
}

.content-gate {
    position: relative;
    margin: -60px auto 0;
    padding-top: 60px;
}

.content-gate-overlay {
    background: linear-gradient(
        to bottom,
        rgba(250, 250, 250, 0) 0%,
        rgba(250, 250, 250, 0.9) 30%,
        var(--color-bg, #fafafa) 50%
    );
    padding: 80px 20px 60px;
    text-align: center;
}

.content-gate-content {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 12px);
    padding: 32px 24px;
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.content-gate-icon {
    font-size: 36px;
    color: var(--color-primary);
    margin-bottom: 12px;
}

.content-gate-heading {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 8px;
}

.content-gate-desc {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0 0 20px;
    line-height: 1.5;
}

.content-gate-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.content-gate-btn {
    padding: 10px 24px;
    font-size: 14px;
    min-width: 100px;
}

@media (max-width: 400px) {
    .content-gate-buttons {
        flex-direction: column;
    }
    .content-gate-btn {
        width: 100%;
    }
}
</style>
