<script>
    import { getDog, getDogBySlug, getDogPosts, getFollowStatus, followDog, unfollowDog,
             getFollowing, getFollowers, startConversation,
             getHealthRecords, deleteHealthRecord, getOwnerDogs } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';
    import { showOnboardingTour, isOnboardingCompleted } from '../../js/onboarding-tour.js';
    import { openEditDogModal, openHealthRecordModal, openFollowListModal, openFollowPickerSheet } from '../../js/modal-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    import ProfileHeader from '../components/ProfileHeader.svelte';
    import ProfileTabs from '../components/ProfileTabs.svelte';
    import PostsGrid from '../components/PostsGrid.svelte';
    import FriendsTab from '../components/FriendsTab.svelte';
    import HealthTab from '../components/HealthTab.svelte';
    import ProfileFollowBar from '../components/ProfileFollowBar.svelte';
    import SiblingDogs from '../components/SiblingDogs.svelte';

    let { params = {}, onopenAuthModal = null } = $props();
    let slug = $derived(params.slug || 'nelli-1');

    let dog = $state(null);
    let loading = $state(true);
    let loadError = $state(false);
    let activeTab = $state('posts');

    // Persist active tab in sessionStorage so back-navigation restores it
    const TAB_KEY = 'woof_tab_positions';
    function saveTab(tab) {
        try {
            const tabs = JSON.parse(sessionStorage.getItem(TAB_KEY) || '{}');
            tabs['/dog/' + slug] = tab;
            sessionStorage.setItem(TAB_KEY, JSON.stringify(tabs));
        } catch { /* ignore */ }
    }
    function restoreTab() {
        try {
            const tabs = JSON.parse(sessionStorage.getItem(TAB_KEY) || '{}');
            return tabs['/dog/' + slug] || 'posts';
        } catch { return 'posts'; }
    }
    function setTab(tab) {
        activeTab = tab;
        saveTab(tab);
    }

    let posts = $state([]);
    let postsLoading = $state(false);
    let nextCursor = $state(null);
    let loadingMore = $state(false);

    let followerCount = $state(0);
    let followingCount = $state(0);
    let isFollowing = $state(false);
    let followLoading = $state(false);
    let followingDogsList = $state([]);
    let siblingDogs = $state([]);

    let friends = $state([]);
    let friendsLoading = $state(false);
    let friendsLoadedOnce = $state(false);

    let healthRecords = $state([]);
    let healthLoading = $state(false);
    let healthLoadedOnce = $state(false);
    let healthFilterType = $state(null);

    // Main init — re-runs when slug or profileVersion changes
    $effect(() => {
        const s = slug;
        const _pv = store.profileVersion; // re-runs on bumpProfileVersion()
        // Reset all state synchronously
        dog = null;
        loading = true;
        loadError = false;
        const hash = window.location.hash.slice(1);
        activeTab = ['posts', 'friends', 'health'].includes(hash) ? hash : restoreTab();
        if (hash) history.replaceState(null, '', window.location.pathname);
        posts = [];
        postsLoading = false;
        followerCount = 0;
        followingCount = 0;
        isFollowing = false;
        followLoading = false;
        followingDogsList = [];
        siblingDogs = [];
        friends = [];
        friendsLoading = false;
        friendsLoadedOnce = false;
        healthRecords = [];
        healthLoading = false;
        healthLoadedOnce = false;
        healthFilterType = null;

        let active = true;

        (async () => {
            try {
                const fetchedDog = s.includes('-')
                    ? await getDogBySlug(s)
                    : await getDog(s);
                if (!active) return;
                dog = fetchedDog;
                loading = false;

                if (dog.isOwner && !isOnboardingCompleted()) {
                    setTimeout(() => showOnboardingTour(dog.name), 500);
                }

                postsLoading = true;
                const [postsResult, followStatus, followingList, ownerDogs] = await Promise.all([
                    getDogPosts(dog.id, null, 20),
                    getFollowStatus(dog.id, store.currentDog?.id),
                    getFollowing(dog.id),
                    getOwnerDogs(dog.id, store.currentDog?.id),
                ]);
                if (!active) return;

                posts = postsResult.posts || [];
                nextCursor = postsResult.nextCursor;
                postsLoading = false;
                followingCount = Array.isArray(followingList) ? followingList.length : 0;
                followerCount = followStatus.followerCount || 0;
                siblingDogs = ownerDogs || [];
                if (!dog.isOwner) {
                    isFollowing = followStatus.isFollowing || false;
                    followingDogsList = followStatus.followingDogs || [];
                }
            } catch (e) {
                if (!active) return;
                loading = false;
                postsLoading = false;
                loadError = true;
                console.error('Profile load error:', e);
            }
        })();

        return () => { active = false; };
    });

    async function loadMorePosts() {
        if (!dog || !nextCursor || loadingMore) return;
        loadingMore = true;
        try {
            const result = await getDogPosts(dog.id, nextCursor, 20);
            posts = [...posts, ...(result.posts || [])];
            nextCursor = result.nextCursor;
        } catch (e) {
            console.error('Load more posts error:', e);
        } finally {
            loadingMore = false;
        }
    }

    // Lazy-load friends/health on first tab visit
    $effect(() => {
        if (activeTab === 'friends' && !friendsLoadedOnce && !friendsLoading && dog) {
            loadFriends();
        }
        if (activeTab === 'health' && !healthLoadedOnce && !healthLoading && dog?.isOwner) {
            loadHealth();
        }
    });

    // Re-fetch health records when healthVersion bumps (HealthRecordModal calls bumpHealthVersion)
    $effect(() => {
        const _hv = store.healthVersion;
        if (dog?.isOwner && dog?.id) loadHealth();
    });

    async function loadFriends() {
        if (!dog?.id) return;
        friendsLoading = true;
        try {
            const [followers, following] = await Promise.all([
                getFollowers(dog.id),
                getFollowing(dog.id),
            ]);
            const followingIds = new Set((following || []).map(d => d.id));
            const mutuals = (followers || []).filter(d => followingIds.has(d.id));
            mutuals.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            friends = mutuals;
        } catch (e) {
            console.error('Failed to load friends:', e);
            friends = [];
        } finally {
            friendsLoading = false;
            friendsLoadedOnce = true;
        }
    }

    async function loadHealth() {
        if (!dog?.isOwner || !dog?.id) return;
        healthLoading = true;
        try {
            const opts = { limit: 50 };
            if (healthFilterType) opts.type = healthFilterType;
            const data = await getHealthRecords(dog.id, opts);
            healthRecords = data.records || [];
        } catch (e) {
            console.error('Failed to load health records:', e);
            healthRecords = [];
        } finally {
            healthLoading = false;
            healthLoadedOnce = true;
        }
    }

    function setHealthFilter(type) {
        healthFilterType = type;
        loadHealth();
    }

    function handleEditDog() {
        openEditDogModal(dog);
    }

    function handleAddHealthRecord() {
        openHealthRecordModal(dog.id, null, null, healthFilterType);
    }

    function handleEditHealthRecord(record) {
        openHealthRecordModal(dog.id, record);
    }

    async function handleDeleteHealthRecord(record) {
        if (!confirm(t('health.deleteConfirm'))) return;
        try {
            await deleteHealthRecord(dog.id, record.id);
            showToast(t('health.recordDeleted'), 'success');
            healthRecords = healthRecords.filter(r => r.id !== record.id);
        } catch (err) {
            console.error('Delete health record failed:', err);
            showToast(t('health.failedDelete'), 'error');
        }
    }

    async function handleFollowToggle() {
        if (!isAuthenticated()) {
            onopenAuthModal?.();
            return;
        }
        if (isFollowing) {
            // Unfollow — same as before
            followLoading = true;
            try {
                await unfollowDog(dog.id, store.currentDog?.id);
                isFollowing = false;
                followerCount = Math.max(0, followerCount - 1);
                followingDogsList = [];
            } catch {
                showToast(t('profile.actionFailed'), 'error');
            } finally {
                followLoading = false;
            }
        } else {
            // Check if multi-dog user
            const myDogs = store.userDogIds || [];
            if (myDogs.length >= 2) {
                openFollowPickerSheet({
                    targetDogId: dog.id,
                    targetDogName: dog.name,
                    onFollowed: () => {
                        isFollowing = true;
                        followerCount++;
                    }
                });
            } else {
                // Single dog — direct follow
                followLoading = true;
                try {
                    await followDog(dog.id, store.currentDog?.id);
                    isFollowing = true;
                    followerCount++;
                    showToast(t('post.nowFollowing').replace('{name}', dog.name), 'success');
                    // Suggest owner's other dogs
                    suggestOwnerDogs(dog.id, dog.name);
                } catch {
                    showToast(t('profile.actionFailed'), 'error');
                } finally {
                    followLoading = false;
                }
            }
        }
    }

    async function suggestOwnerDogs(dogId, dogName) {
        try {
            const ownerDogs = await getOwnerDogs(dogId, store.currentDog?.id);
            const unfollowed = (ownerDogs || []).filter(d => !d.isFollowing && d.id !== store.currentDog?.id);
            if (unfollowed.length > 0) {
                const names = unfollowed.map(d => d.name).join(', ');
                showToast(
                    t('follow.ownerHasOtherDogs')
                        .replace('{name}', dogName)
                        .replace('{names}', names),
                    'info'
                );
            }
        } catch { /* ignore */ }
    }

    async function handleMessage() {
        if (!isAuthenticated()) {
            showToast(t('messages.loginToMessage'), 'error');
            return;
        }
        try {
            const { conversationId } = await startConversation(dog.id, store.currentDog?.id);
            const path = `/messages/${conversationId}`;
            history.pushState({}, '', path);
            window.dispatchEvent(new CustomEvent('routechange'));
        } catch (e) {
            console.error('Failed to start conversation:', e);
            showToast(t('messages.failedStart'), 'error');
        }
    }
</script>

<div class="profile-page">
    {#if loading}
        <div class="profile-hero" id="profile-hero"></div>
        <div class="profile-sheet">
            <div class="profile-container">
                <div class="profile-skeleton">
                    <div class="skeleton skeleton-circle"></div>
                    <div class="skeleton-details">
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text" style="width:60%"></div>
                    </div>
                </div>
            </div>
        </div>
    {:else if loadError || !dog}
        <div class="profile-sheet">
            <div class="profile-container">
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon woof-empty-state-icon--error">
                        <i class="fas fa-circle-exclamation"></i>
                    </div>
                    <p>Failed to load profile.</p>
                </div>
            </div>
        </div>
    {:else}
        <div class="profile-hero" id="profile-hero">
            <img
                src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                alt={dog.name}
                class="profile-hero-img"
                onerror={(e) => { if (!e.currentTarget.src.endsWith('/images/dog_profile_pic.jpg')) e.currentTarget.src = '/images/dog_profile_pic.jpg'; }}
            />
        </div>
        <div class="profile-sheet">
            <div class="profile-container">
                <ProfileHeader
                    {dog}
                    postsCount={posts.length}
                    {postsLoading}
                    {followerCount}
                    {followingCount}
                    isOwner={dog.isOwner}
                    onEditClick={handleEditDog}
                    onFollowersClick={() => openFollowListModal(dog.id, 'followers')}
                    onFollowingClick={() => openFollowListModal(dog.id, 'following')}
                />
            </div>

            {#if siblingDogs.length > 0}
                <div class="profile-container">
                    <SiblingDogs dogs={siblingDogs} />
                </div>
            {/if}

            <ProfileTabs
                {activeTab}
                onTabChange={setTab}
                showHealth={dog.isOwner}
            />

            <!-- Posts tab -->
            <div class="tab-content" class:active={activeTab === 'posts'} id="posts" role="tabpanel" aria-hidden={activeTab !== 'posts'}>
                <PostsGrid
                    {posts}
                    loading={postsLoading}
                    hasMore={!!nextCursor}
                    {loadingMore}
                    onLoadMore={loadMorePosts}
                />
            </div>

            <!-- Friends tab -->
            <div class="tab-content" class:active={activeTab === 'friends'} id="friends" role="tabpanel" aria-hidden={activeTab !== 'friends'}>
                <FriendsTab
                    {friends}
                    loading={friendsLoading}
                    loadedOnce={friendsLoadedOnce}
                />
            </div>

            <!-- Health tab -->
            <div class="tab-content" class:active={activeTab === 'health'} id="health" role="tabpanel" aria-hidden={activeTab !== 'health'}>
                <HealthTab
                    isOwner={dog.isOwner}
                    records={healthRecords}
                    loading={healthLoading}
                    loadedOnce={healthLoadedOnce}
                    filterType={healthFilterType}
                    onFilterChange={setHealthFilter}
                    onAddRecord={handleAddHealthRecord}
                    onEditRecord={handleEditHealthRecord}
                    onDeleteRecord={handleDeleteHealthRecord}
                />
            </div>
        </div>

        {#if !dog.isOwner}
            <ProfileFollowBar
                {isFollowing}
                {followLoading}
                followingDogs={followingDogsList}
                onFollowToggle={handleFollowToggle}
                onMessage={handleMessage}
            />
        {/if}
    {/if}
</div>

<style>
/* -- Big-picture profile layout -- */
.profile-page {
    margin: -20px;
    min-height: 100vh;
}

.profile-hero {
    width: 100%;
    height: 48vh;
    min-height: 240px;
    max-height: 380px;
    overflow: hidden;
    background: var(--woof-color-neutral-200);
    position: relative;
}

.profile-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    display: block;
}

.profile-sheet {
    background: var(--woof-surface-primary);
    border-radius: var(--woof-radius-2xl) var(--woof-radius-2xl) 0 0;
    margin-top: -28px;
    position: relative;
    z-index: 1;
    padding: 24px 20px 120px;
    min-height: 60vh;
    width: 100%;
    box-sizing: border-box;
}

@media (max-width: 768px) {
    .profile-page {
        margin: -20px 0 0;
    }
}
</style>
