<script>
    import { getFeed, getMyDogs, getAllDogs } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { openCreateDogModal } from '../../js/modal-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import PostCard from './PostCard.svelte';
    import InviteCard from './InviteCard.svelte';
    import { viewport } from '../actions/viewport.ts';

    let { type = 'public', onopenAuthModal = null } = $props();

    let posts = $state([]);
    let nextCursor = $state(null);
    let loading = $state(true);
    let myDogs = $state([]);

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
        } finally {
            loading = false;
        }
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

            try {
                const [feedResult, dogsResult] = await Promise.all([
                    getFeed(currentType),
                    authUser ? getMyDogs().catch(() => []) : Promise.resolve([]),
                ]);
                if (!cleanup) {
                    posts = feedResult.posts || [];
                    nextCursor = feedResult.nextCursor;
                    myDogs = dogsResult;
                }
            } catch (e) {
                console.error('Failed to load feed:', e);
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
{:else if !loading && posts.length === 0 && type === 'following'}
    {#if isAuthenticated()}
        <div class="empty-state">
            <i class="fas fa-user-friends"></i>
            <p>Your following feed is empty.</p>
            <p>Follow dogs from the <strong>For You</strong> tab to see their posts here!</p>
        </div>
    {:else}
        <div class="empty-state">
            <i class="fas fa-user-friends"></i>
            <p>Sign up to follow dogs and see their posts here!</p>
        </div>
    {/if}
{:else}
    {#if isAuthenticated() && myDogs.length === 0 && !loading}
        <div class="welcome-card">
            <div class="welcome-card-icon"><i class="fas fa-paw"></i></div>
            <h2>Welcome to Woof!</h2>
            <p>Add your dog to start posting, follow other dogs, and join the community.</p>
            <button class="btn-primary welcome-card-btn" onclick={handleAddDog}>
                <i class="fas fa-plus"></i> Add Your Dog
            </button>
        </div>
    {/if}

    {#each visibleItems as item (item.id ?? item._key ?? item)}
        {#if item.type === 'invite'}
            <InviteCard />
        {:else}
            <PostCard
                id={item.id}
                profilePic={item.dogPhoto || '/images/dog_profile_pic.jpg'}
                username={item.dogName || 'Unknown Dog'}
                imageUrl={item.imageUrl}
                caption={item.caption || ''}
                dogSlug={item.dogSlug || ''}
                dogId={item.dogId || ''}
                isOwnPost={myDogs.some(d => d.id === item.dogId)}
                likeCount={item.likeCount || 0}
                commentCount={item.commentCount || 0}
                likedByUser={item.likedByUser || false}
                createdAt={item.createdAt}
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
                    <h2 class="content-gate-heading">Want to see more?</h2>
                    <p class="content-gate-desc">Sign up to browse the full feed, follow dogs, and share your own pup's adventures.</p>
                    <div class="content-gate-buttons">
                        <button class="btn-primary content-gate-btn" onclick={handleOpenAuthModal}>Sign Up</button>
                        <button class="btn-secondary content-gate-btn" onclick={handleOpenAuthModal}>Log In</button>
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

<style>
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
