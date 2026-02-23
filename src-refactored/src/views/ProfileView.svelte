<script>
    import { getDog, getDogBySlug, getDogPosts, getFollowStatus, followDog, unfollowDog,
             getFollowing, getFollowers, startConversation,
             getHealthRecords, deleteHealthRecord } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';
    import { showOnboardingTour, isOnboardingCompleted } from '../../js/onboarding-tour.js';

    let { params = {}, onopenAuthModal = null } = $props();
    let slug = $derived(params.slug || 'nelli-1');

    const HEALTH_TYPE_CONFIG = {
        vet_visit:   { icon: 'fa-stethoscope', label: 'Vet Visit',   color: '#3b82f6' },
        vaccination: { icon: 'fa-syringe',     label: 'Vaccination', color: '#10b981' },
        medication:  { icon: 'fa-pills',       label: 'Medication',  color: '#f59e0b' },
        weight:      { icon: 'fa-weight',      label: 'Weight',      color: '#EF4621' },
        note:        { icon: 'fa-sticky-note', label: 'Note',        color: '#6b7280' },
    };

    let dog = $state(null);
    let loading = $state(true);
    let loadError = $state(false);
    let activeTab = $state('posts');

    let posts = $state([]);
    let postsLoading = $state(false);

    let followerCount = $state(0);
    let followingCount = $state(0);
    let isFollowing = $state(false);
    let followLoading = $state(false);

    let friends = $state([]);
    let friendsLoading = $state(false);
    let friendsLoadedOnce = $state(false);

    let healthRecords = $state([]);
    let healthLoading = $state(false);
    let healthLoadedOnce = $state(false);
    let healthFilterType = $state(null);

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }

    function formatHealthDate(date) {
        const parseable = typeof date === 'string' && date.length === 10
            ? date + 'T00:00:00' : date;
        return new Date(parseable).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    // Main init — re-runs when slug changes
    $effect(() => {
        const s = slug;
        // Reset all state synchronously
        dog = null;
        loading = true;
        loadError = false;
        activeTab = 'posts';
        posts = [];
        postsLoading = false;
        followerCount = 0;
        followingCount = 0;
        isFollowing = false;
        followLoading = false;
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
                const [postsResult, followStatus, followingList] = await Promise.all([
                    getDogPosts(dog.id),
                    getFollowStatus(dog.id),
                    getFollowing(dog.id),
                ]);
                if (!active) return;

                posts = postsResult.posts || [];
                postsLoading = false;
                followingCount = Array.isArray(followingList) ? followingList.length : 0;
                followerCount = followStatus.followerCount || 0;
                if (!dog.isOwner) {
                    isFollowing = followStatus.isFollowing || false;
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

    // Lazy-load friends/health on first tab visit
    $effect(() => {
        if (activeTab === 'friends' && !friendsLoadedOnce && !friendsLoading && dog) {
            loadFriends();
        }
        if (activeTab === 'health' && !healthLoadedOnce && !healthLoading && dog?.isOwner) {
            loadHealth();
        }
    });

    // Listen for profile-refresh from EditDogModal
    $effect(() => {
        async function handleProfileRefresh() {
            if (!dog) return;
            try {
                const refreshedDog = slug.includes('-')
                    ? await getDogBySlug(slug)
                    : await getDog(slug);
                dog = refreshedDog;
            } catch (e) {
                console.error('Profile refresh failed:', e);
            }
        }
        window.addEventListener('profile-refresh', handleProfileRefresh);
        return () => window.removeEventListener('profile-refresh', handleProfileRefresh);
    });

    // Listen for health-refresh from HealthRecordModal
    $effect(() => {
        function handleHealthRefresh() {
            if (dog?.isOwner && dog?.id) {
                loadHealth();
            }
        }
        window.addEventListener('health-refresh', handleHealthRefresh);
        return () => window.removeEventListener('health-refresh', handleHealthRefresh);
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
        window.dispatchEvent(new CustomEvent('openEditDogModal', { detail: dog }));
    }

    function handleAddHealthRecord() {
        window.dispatchEvent(new CustomEvent('openHealthRecordModal', {
            detail: { dogId: dog.id, record: null }
        }));
    }

    function handleEditHealthRecord(record) {
        window.dispatchEvent(new CustomEvent('openHealthRecordModal', {
            detail: { dogId: dog.id, record }
        }));
    }

    async function handleDeleteHealthRecord(record) {
        if (!confirm('Delete this health record?')) return;
        try {
            await deleteHealthRecord(dog.id, record.id);
            showToast('Record deleted', 'success');
            healthRecords = healthRecords.filter(r => r.id !== record.id);
        } catch (err) {
            console.error('Delete health record failed:', err);
            showToast('Failed to delete record', 'error');
        }
    }

    async function handleFollowToggle() {
        if (!isAuthenticated()) {
            showToast('Please log in to follow dogs', 'error');
            return;
        }
        followLoading = true;
        try {
            if (isFollowing) {
                await unfollowDog(dog.id);
                isFollowing = false;
                followerCount = Math.max(0, followerCount - 1);
            } else {
                await followDog(dog.id);
                isFollowing = true;
                followerCount = followerCount + 1;
            }
        } catch (e) {
            console.error('Follow toggle failed:', e);
            showToast('Action failed. Please try again.', 'error');
        } finally {
            followLoading = false;
        }
    }

    async function handleMessage() {
        if (!isAuthenticated()) {
            showToast('Please log in to send messages', 'error');
            return;
        }
        try {
            const { conversationId } = await startConversation(dog.id);
            const path = `/messages/${conversationId}`;
            history.pushState({}, '', path);
            window.dispatchEvent(new CustomEvent('routechange'));
        } catch (e) {
            console.error('Failed to start conversation:', e);
            showToast('Failed to start conversation', 'error');
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
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
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
                onerror={fallbackImg}
            />
        </div>
        <div class="profile-sheet">
            <div class="profile-container">
                <div class="profile-sheet-namerow">
                    <div>
                        <div class="profile-sheet-name">{dog.name}</div>
                        <div class="profile-sheet-breed"><i class="fas fa-paw"></i> {dog.breed}</div>
                    </div>
                    {#if dog.isOwner}
                        <button class="edit-profile-btn" onclick={handleEditDog}>
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    {/if}
                </div>
                <div class="profile-sheet-stats">
                    <div class="profile-sheet-stat">
                        <div class="profile-sheet-stat-num">{postsLoading ? '—' : posts.length}</div>
                        <div class="profile-sheet-stat-label">Posts</div>
                    </div>
                    <div class="profile-sheet-stat">
                        <div class="profile-sheet-stat-num">{followerCount}</div>
                        <div class="profile-sheet-stat-label">Followers</div>
                    </div>
                    <div class="profile-sheet-stat">
                        <div class="profile-sheet-stat-num">{followingCount}</div>
                        <div class="profile-sheet-stat-label">Following</div>
                    </div>
                </div>
                {#if dog.bio}
                    <p class="profile-sheet-bio">{dog.bio}</p>
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
                    class:active={activeTab === 'friends'}
                    role="tab"
                    aria-selected={activeTab === 'friends'}
                    onclick={() => activeTab = 'friends'}
                >
                    <i class="fas fa-user-friends"></i> Friends
                </button>
                <button
                    class="tab-link"
                    class:active={activeTab === 'health'}
                    role="tab"
                    aria-selected={activeTab === 'health'}
                    onclick={() => activeTab = 'health'}
                >
                    <i class="fas fa-heartbeat"></i> Health
                </button>
            </div>

            <!-- Posts tab -->
            <div class="tab-content" class:active={activeTab === 'posts'} id="posts" role="tabpanel" aria-hidden={activeTab !== 'posts'}>
                {#if postsLoading}
                    <div class="health-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if posts.length === 0}
                    <div class="empty-state">
                        <i class="fas fa-camera"></i>
                        <p>{dog.isOwner ? 'No posts yet. Share your first photo!' : 'No posts yet.'}</p>
                    </div>
                {:else}
                    <div class="posts-grid posts-grid-2col">
                        {#each posts as post (post.id)}
                            <a href="/post/{post.id}" data-link class="posts-grid-item">
                                <img src={post.imageUrl} alt={post.caption || 'Post image'} loading="lazy" onerror={fallbackImg} />
                                <div class="posts-grid-overlay">
                                    <span><i class="fas fa-heart"></i> {post.likeCount || 0}</span>
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Friends tab -->
            <div class="tab-content" class:active={activeTab === 'friends'} id="friends" role="tabpanel" aria-hidden={activeTab !== 'friends'}>
                {#if friendsLoading}
                    <div class="health-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if friends.length === 0 && friendsLoadedOnce}
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <p>No friends yet. Start connecting!</p>
                    </div>
                {:else if friends.length > 0}
                    <ul class="friend-list">
                        {#each friends as friend (friend.id)}
                            <li class="friend-item">
                                <a href="/dog/{friend.slug || friend.id}" data-link class="friend-link">
                                    <img
                                        src={friend.profilePhoto || '/images/dog_profile_pic.jpg'}
                                        alt={friend.name}
                                        loading="lazy"
                                        class="friend-avatar"
                                        onerror={fallbackImg}
                                    />
                                    <div class="friend-info">
                                        <span class="friend-name">{friend.name}</span>
                                        <span class="friend-breed">{friend.breed}</span>
                                    </div>
                                </a>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>

            <!-- Health tab -->
            <div class="tab-content" class:active={activeTab === 'health'} id="health" role="tabpanel" aria-hidden={activeTab !== 'health'}>
                {#if !dog.isOwner}
                    <div class="private-content">
                        <i class="fas fa-lock"></i>
                        <p>Health records are private and only visible to the owner.</p>
                    </div>
                {:else}
                    <div class="health-header">
                        <h2>Health Records</h2>
                        <button class="btn-primary health-add-btn" onclick={handleAddHealthRecord}>
                            <i class="fas fa-plus"></i> Add Record
                        </button>
                    </div>
                    <div class="health-filters" id="health-filters">
                        <button class="health-filter-btn" class:active={healthFilterType === null} onclick={() => setHealthFilter(null)}>All</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'vet_visit'} onclick={() => setHealthFilter('vet_visit')}><i class="fas fa-stethoscope"></i> Vet</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'vaccination'} onclick={() => setHealthFilter('vaccination')}><i class="fas fa-syringe"></i> Vaccines</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'medication'} onclick={() => setHealthFilter('medication')}><i class="fas fa-pills"></i> Meds</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'weight'} onclick={() => setHealthFilter('weight')}><i class="fas fa-weight"></i> Weight</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'note'} onclick={() => setHealthFilter('note')}><i class="fas fa-sticky-note"></i> Notes</button>
                    </div>
                    <div class="health-timeline">
                        {#if healthLoading}
                            <div class="health-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
                        {:else if healthRecords.length === 0}
                            {#if healthFilterType}
                                <div class="empty-state">
                                    <i class="fas fa-heartbeat"></i>
                                    <p>No records of this type yet.</p>
                                </div>
                            {:else}
                                <div class="empty-state">
                                    <i class="fas fa-heartbeat"></i>
                                    <p>Start tracking your dog's health!</p>
                                    <button class="btn-primary" style="margin-top:12px" onclick={handleAddHealthRecord}>
                                        <i class="fas fa-plus"></i> Add First Record
                                    </button>
                                </div>
                            {/if}
                        {:else}
                            {#each healthRecords as record (record.id)}
                                {@const config = HEALTH_TYPE_CONFIG[record.type] || HEALTH_TYPE_CONFIG.note}
                                <div class="health-card">
                                    <div class="health-card-icon" style="background-color: {config.color}">
                                        <i class="fas {config.icon}"></i>
                                    </div>
                                    <div class="health-card-body">
                                        <div class="health-card-header">
                                            <span class="health-card-type">{config.label}</span>
                                            <span class="health-card-date">{formatHealthDate(record.date)}</span>
                                        </div>
                                        <p class="health-card-desc">{record.description}</p>
                                        {#if record.notes}
                                            <p class="health-card-notes">{record.notes}</p>
                                        {/if}
                                        {#if record.type === 'weight' && record.value != null}
                                            <span class="health-value"><i class="fas fa-weight"></i> {record.value} kg</span>
                                        {/if}
                                    </div>
                                    <div class="health-card-actions">
                                        <button class="health-action-btn health-edit-btn" title="Edit" onclick={() => handleEditHealthRecord(record)}>
                                            <i class="fas fa-pen"></i>
                                        </button>
                                        <button class="health-action-btn health-delete-btn" title="Delete" onclick={() => handleDeleteHealthRecord(record)}>
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        {#if !dog.isOwner}
            <div class="profile-follow-sticky" id="profile-follow-sticky">
                <div class="profile-follow-actions">
                    <button
                        class="follow-btn"
                        class:following={isFollowing}
                        disabled={followLoading}
                        onclick={handleFollowToggle}
                    >
                        {#if isFollowing}
                            <i class="fas fa-user-check"></i> Following
                        {:else}
                            <i class="fas fa-user-plus"></i> Follow
                        {/if}
                    </button>
                    <button
                        class="message-profile-btn icon-only"
                        title="Message"
                        aria-label="Message"
                        onclick={handleMessage}
                    >
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</div>
