<script>
    import { getDog, getDogBySlug, getDogPosts, getFollowStatus, followDog, unfollowDog,
             getFollowing, getFollowers, startConversation,
             getHealthRecords, deleteHealthRecord } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast, imageVariant } from '../../js/utils.js';
    import { showOnboardingTour, isOnboardingCompleted } from '../../js/onboarding-tour.js';
    import { openEditDogModal, openHealthRecordModal, openFollowListModal } from '../../js/modal-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let { params = {}, onopenAuthModal = null } = $props();
    let slug = $derived(params.slug || 'nelli-1');

    const HEALTH_TYPE_CONFIG = {
        vet_visit:   { icon: 'fa-stethoscope', labelKey: 'health.vetVisit',    color: '#3b82f6' },
        vaccination: { icon: 'fa-syringe',     labelKey: 'health.vaccination', color: '#10b981' },
        medication:  { icon: 'fa-pills',       labelKey: 'health.medication',  color: '#f59e0b' },
        weight:      { icon: 'fa-weight',      labelKey: 'health.weight',      color: '#C9403F' },
        note:        { icon: 'fa-sticky-note', labelKey: 'health.note',        color: '#6b7280' },
    };

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

    let friends = $state([]);
    let friendsLoading = $state(false);
    let friendsLoadedOnce = $state(false);

    let healthRecords = $state([]);
    let healthLoading = $state(false);
    let healthLoadedOnce = $state(false);
    let healthFilterType = $state(null);

    function formatAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        const dob = new Date(dateOfBirth + 'T00:00:00');
        const now = new Date();
        const diffMs = now - dob;
        const totalMonths = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        if (years === 0 && months === 0) return t('profile.newborn');
        if (years === 0) return months === 1
            ? t('profile.monthSingular', { count: months })
            : t('profile.monthPlural', { count: months });
        if (months === 0) return years === 1
            ? t('profile.yearSingular', { count: years })
            : t('profile.yearPlural', { count: years });
        return t('profile.yearMonth', { years, months });
    }

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }

    function formatHealthDate(date) {
        const parseable = typeof date === 'string' && date.length === 10
            ? date + 'T00:00:00' : date;
        return new Date(parseable).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    // Main init — re-runs when slug or profileVersion changes
    $effect(() => {
        const s = slug;
        const _pv = store.profileVersion; // re-runs on bumpProfileVersion()
        // Reset all state synchronously
        dog = null;
        loading = true;
        loadError = false;
        activeTab = restoreTab();
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
                    getDogPosts(dog.id, null, 20),
                    getFollowStatus(dog.id),
                    getFollowing(dog.id),
                ]);
                if (!active) return;

                posts = postsResult.posts || [];
                nextCursor = postsResult.nextCursor;
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
        openHealthRecordModal(dog.id, null);
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
            showToast(t('profile.loginToFollow'), 'error');
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
            showToast(t('profile.actionFailed'), 'error');
        } finally {
            followLoading = false;
        }
    }

    async function handleMessage() {
        if (!isAuthenticated()) {
            showToast(t('messages.loginToMessage'), 'error');
            return;
        }
        try {
            const { conversationId } = await startConversation(dog.id);
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
                        <i class="fas fa-exclamation-circle"></i>
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
                onerror={fallbackImg}
            />
        </div>
        <div class="profile-sheet">
            <div class="profile-container">
                <div class="profile-sheet-namerow">
                    <div>
                        <div class="profile-sheet-name">{dog.name}</div>
                        <a href="/breed/{dog.breedSlug}" data-link class="profile-sheet-breed"><i class="fas fa-paw"></i> {dog.breedName}</a>
                        {#if dog.territoryName}
                            {@const territoryDisplay = dog.territoryType === 'sub_district' && dog.territoryParentName && dog.territoryGrandparentName
                                ? `${dog.territoryName}, ${dog.territoryParentName}, ${dog.territoryGrandparentName}`
                                : dog.territoryType === 'district' && dog.territoryParentName
                                    ? `${dog.territoryName}, ${dog.territoryParentName}`
                                    : dog.territoryName}
                            {#if dog.territoryUrlPath}
                                <a href="/territory/{dog.territoryUrlPath}" data-link class="profile-sheet-territory"><i class="fas fa-map-marker-alt"></i> {territoryDisplay}</a>
                            {:else}
                                <span class="profile-sheet-territory"><i class="fas fa-map-marker-alt"></i> {territoryDisplay}</span>
                            {/if}
                        {/if}
                        {#if dog.dateOfBirth}
                            <span class="profile-sheet-age"><i class="fas fa-birthday-cake"></i> {formatAge(dog.dateOfBirth)}</span>
                        {:else if dog.age != null}
                            <span class="profile-sheet-age"><i class="fas fa-birthday-cake"></i> {dog.age === 1 ? t('profile.yearSingular', { count: dog.age }) : t('profile.yearPlural', { count: dog.age })}</span>
                        {/if}
                    </div>
                    {#if dog.isOwner}
                        <button class="edit-profile-btn" onclick={handleEditDog}>
                            <i class="fas fa-edit"></i> {t('profile.editProfile')}
                        </button>
                    {/if}
                </div>
                <div class="profile-sheet-stats">
                    <div class="profile-sheet-stat">
                        <div class="profile-sheet-stat-num">{postsLoading ? '—' : posts.length}</div>
                        <div class="profile-sheet-stat-label">{t('profile.posts')}</div>
                    </div>
                    <button class="profile-sheet-stat profile-sheet-stat-clickable" aria-label="{followerCount} {t('profile.followers')}" onclick={() => openFollowListModal(dog.id, 'followers')}>
                        <div class="profile-sheet-stat-num">{followerCount}</div>
                        <div class="profile-sheet-stat-label">{t('profile.followers')}</div>
                    </button>
                    <button class="profile-sheet-stat profile-sheet-stat-clickable" aria-label="{followingCount} {t('profile.following')}" onclick={() => openFollowListModal(dog.id, 'following')}>
                        <div class="profile-sheet-stat-num">{followingCount}</div>
                        <div class="profile-sheet-stat-label">{t('profile.following')}</div>
                    </button>
                </div>
                {#if dog.bio}
                    <p class="profile-sheet-bio">{dog.bio}</p>
                {/if}
                {#if dog.isOwner && !dog.territoryId}
                    <div class="territory-nudge">
                        <span class="territory-nudge-text">
                            <i class="fas fa-map-marker-alt"></i>
                            {t('dog.territoryHint')}
                        </span>
                        <button class="territory-nudge-btn" onclick={handleEditDog}>Set</button>
                    </div>
                {/if}
            </div>

            <div class="profile-tabs" role="tablist">
                <button
                    class="tab-link"
                    class:active={activeTab === 'posts'}
                    role="tab"
                    aria-selected={activeTab === 'posts'}
                    onclick={() => setTab('posts')}
                >
                    <i class="fas fa-th"></i> {t('profile.posts')}
                </button>
                <button
                    class="tab-link"
                    class:active={activeTab === 'friends'}
                    role="tab"
                    aria-selected={activeTab === 'friends'}
                    onclick={() => setTab('friends')}
                >
                    <i class="fas fa-user-friends"></i> {t('profile.friends')}
                </button>
                <button
                    class="tab-link"
                    class:active={activeTab === 'health'}
                    role="tab"
                    aria-selected={activeTab === 'health'}
                    onclick={() => setTab('health')}
                >
                    <i class="fas fa-heartbeat"></i> {t('profile.health')}
                </button>
            </div>

            <!-- Posts tab -->
            <div class="tab-content" class:active={activeTab === 'posts'} id="posts" role="tabpanel" aria-hidden={activeTab !== 'posts'}>
                {#if postsLoading}
                    <div class="health-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if posts.length === 0}
                    <div class="woof-empty-state">
                        <div class="woof-empty-state-icon">
                            <i class="fas fa-camera"></i>
                        </div>
                        <p>{t('profile.noPosts')}</p>
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
                    {#if nextCursor}
                        <button
                            class="load-more-btn"
                            onclick={loadMorePosts}
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
            </div>

            <!-- Friends tab -->
            <div class="tab-content" class:active={activeTab === 'friends'} id="friends" role="tabpanel" aria-hidden={activeTab !== 'friends'}>
                {#if friendsLoading}
                    <div class="health-loading"><i class="fas fa-spinner fa-spin"></i></div>
                {:else if friends.length === 0 && friendsLoadedOnce}
                    <div class="woof-empty-state">
                        <div class="woof-empty-state-icon">
                            <i class="fas fa-user-friends"></i>
                        </div>
                        <p>{t('profile.noFollowers')}</p>
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
                                        <span class="friend-breed">{friend.breedName}</span>
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
                        <p>{t('health.privateNotice')}</p>
                    </div>
                {:else}
                    <div class="health-header">
                        <h2>{t('profile.health')}</h2>
                        <button class="btn-primary health-add-btn" onclick={handleAddHealthRecord}>
                            <i class="fas fa-plus"></i> {t('health.addRecordBtn')}
                        </button>
                    </div>
                    <div class="health-filters" id="health-filters">
                        <button class="health-filter-btn" class:active={healthFilterType === null} onclick={() => setHealthFilter(null)}>{t('admin.all')}</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'vet_visit'} onclick={() => setHealthFilter('vet_visit')}><i class="fas fa-stethoscope"></i> {t('health.vetVisit')}</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'vaccination'} onclick={() => setHealthFilter('vaccination')}><i class="fas fa-syringe"></i> {t('health.vaccination')}</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'medication'} onclick={() => setHealthFilter('medication')}><i class="fas fa-pills"></i> {t('health.medication')}</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'weight'} onclick={() => setHealthFilter('weight')}><i class="fas fa-weight"></i> {t('health.weight')}</button>
                        <button class="health-filter-btn" class:active={healthFilterType === 'note'} onclick={() => setHealthFilter('note')}><i class="fas fa-sticky-note"></i> {t('health.note')}</button>
                    </div>
                    <div class="health-timeline">
                        {#if healthLoading}
                            <div class="health-loading"><i class="fas fa-spinner fa-spin"></i> {t('common.loading')}...</div>
                        {:else if healthRecords.length === 0}
                            {#if healthFilterType}
                                <div class="woof-empty-state">
                                    <div class="woof-empty-state-icon">
                                        <i class="fas fa-heartbeat"></i>
                                    </div>
                                    <p>{t('health.noRecords')}</p>
                                </div>
                            {:else}
                                <div class="woof-empty-state">
                                    <div class="woof-empty-state-icon">
                                        <i class="fas fa-heartbeat"></i>
                                    </div>
                                    <p>{t('health.startTracking')}</p>
                                    <button class="btn-primary" style="margin-top: var(--woof-space-1);" onclick={handleAddHealthRecord}>
                                        <i class="fas fa-plus"></i> {t('health.addFirstRecord')}
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
                                            <span class="health-card-type">{t(config.labelKey)}</span>
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
                        {#if followLoading}
                            <i class="fas fa-spinner fa-spin"></i>
                        {:else if isFollowing}
                            <i class="fas fa-user-check"></i> {t('profile.followingBtn')}
                        {:else}
                            <i class="fas fa-user-plus"></i> {t('profile.followBtn')}
                        {/if}
                    </button>
                    <button
                        class="message-profile-btn icon-only"
                        title={t('profile.message')}
                        aria-label={t('profile.message')}
                        onclick={handleMessage}
                    >
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
/* ── Big-picture profile layout ── */
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

.profile-sheet-namerow {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
}

.profile-sheet-name {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    letter-spacing: -0.5px;
    line-height: 1.1;
}

.profile-sheet-breed {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-brand-primary);
    font-weight: var(--woof-font-weight-semibold);
    margin-top: 6px;
    text-decoration: none;
}

.profile-sheet-breed:hover {
    text-decoration: underline;
}

a.profile-sheet-territory {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 4px;
    text-decoration: none;
}

a.profile-sheet-territory:hover {
    text-decoration: underline;
}

span.profile-sheet-territory {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 4px;
}

.profile-sheet-territory i,
a.profile-sheet-territory i {
    font-size: 11px;
}

.profile-sheet-age {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 4px;
}

.profile-sheet-age i {
    font-size: 11px;
}

.territory-nudge {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3);
    background: var(--woof-color-brand-primary-subtle);
    border-radius: var(--woof-radius-md);
    margin-bottom: var(--woof-space-4);
}

.territory-nudge-text {
    flex: 1;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-700);
    line-height: 1.4;
}

.territory-nudge-text i {
    color: var(--woof-color-brand-primary);
    margin-right: var(--woof-space-1);
}

.territory-nudge-btn {
    flex-shrink: 0;
    padding: var(--woof-space-1) var(--woof-space-3);
    border: 1px solid var(--woof-color-brand-primary);
    border-radius: var(--woof-btn-radius);
    background: transparent;
    color: var(--woof-color-brand-primary);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
}

.territory-nudge-btn:hover {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
}

.profile-sheet-stats {
    display: flex;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.profile-sheet-stat {
    flex: 1;
    padding-right: 16px;
    margin-right: 16px;
    border-right: 1px solid var(--woof-color-neutral-200);
}

.profile-sheet-stat:last-child {
    border-right: none;
    padding-right: 0;
    margin-right: 0;
}

.profile-sheet-stat-num {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-heavy);
    color: var(--woof-color-neutral-900);
    line-height: 1;
}

.profile-sheet-stat-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 3px;
}

.profile-sheet-stat-clickable {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    text-align: left;
    transition: opacity var(--woof-duration-fast);
}

.profile-sheet-stat-clickable:hover {
    opacity: 0.7;
}

.profile-sheet-bio {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-700);
    line-height: 1.5;
    margin-bottom: 16px;
}

/* Sticky follow/message bar */
.profile-follow-sticky {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px 16px 300px;
    background: linear-gradient(to top, rgba(255,255,255,1) 55%, rgba(255,255,255,0));
    z-index: 50;
    pointer-events: none;
}

.profile-follow-sticky:empty {
    display: none;
}

.profile-follow-actions {
    display: flex;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto;
    pointer-events: all;
}

.profile-follow-actions .follow-btn {
    flex: 1;
    height: var(--woof-btn-height-lg);
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
}

.profile-follow-actions .message-profile-btn.icon-only {
    width: var(--woof-btn-height-lg);
    height: var(--woof-btn-height-lg);
    padding: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

/* Profile tabs */
.profile-tabs {
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0;
    position: sticky;
    top: 0;
    background: var(--color-surface);
    z-index: 10;
}

.profile-tabs .tab-link {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 16px;
    background: transparent;
    border: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    position: relative;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s;
}

.profile-tabs .tab-link i {
    font-size: 14px;
}

.profile-tabs .tab-link.active {
    color: var(--color-primary);
}

.profile-tabs .tab-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: transparent;
    transition: background-color 0.2s;
}

.profile-tabs .tab-link.active::after {
    background-color: var(--color-primary);
}

/* Posts grid */
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

/* Friend list */
.friend-list {
    list-style-type: none;
    padding: 8px 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.friend-item {
    list-style: none;
}

.friend-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s;
}

.friend-link:hover {
    background-color: var(--color-hover, rgba(0, 0, 0, 0.03));
}

.friend-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.friend-info {
    flex: 1;
    min-width: 0;
}

.friend-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
}

.friend-breed {
    display: block;
    font-size: 13px;
    color: var(--color-text-secondary);
}

/* Health records */
.health-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.health-header h2 {
    margin: 0;
    font-size: 18px;
}

.health-add-btn {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 20px;
}

.health-filters {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 14px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.health-filters::-webkit-scrollbar {
    display: none;
}

.health-filter-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: var(--color-surface);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

.health-filter-btn i {
    font-size: 11px;
}

.health-filter-btn:hover {
    border-color: var(--color-text-secondary);
    background: var(--color-bg-alt);
}

.health-filter-btn.active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
}

.health-timeline {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.health-loading {
    text-align: center;
    padding: 32px;
    color: var(--color-text-secondary);
}

.health-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: box-shadow 0.2s;
}

.health-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.health-card-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
}

.health-card-body {
    flex: 1;
    min-width: 0;
}

.health-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.health-card-type {
    font-weight: 600;
    font-size: 13px;
    color: var(--color-text);
}

.health-card-date {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.health-card-desc {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--color-text);
}

.health-card-notes {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    font-style: italic;
}

.health-value {
    display: inline-block;
    margin-top: 4px;
    padding: 2px 8px;
    background: var(--woof-color-brand-primary-subtle);
    border-radius: var(--woof-radius-full);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
}

.health-card-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s;
}

.health-card:hover .health-card-actions {
    opacity: 1;
}

.health-action-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--woof-radius-full);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all 0.2s;
}

.health-action-btn:hover {
    background: var(--color-border);
    color: var(--color-text);
}

.health-delete-btn:hover {
    background: #fee2e2;
    color: #ef4444;
}

.private-content {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-text-secondary);
}

.private-content i {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
}

/* Message button on profile */
.message-profile-btn {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--woof-btn-radius);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.message-profile-btn:hover {
    background-color: var(--color-bg-alt);
}

/* Follow button */
.follow-btn {
    padding: 6px 20px;
    border: none;
    border-radius: var(--woof-btn-radius);
    background: var(--color-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-subheadline);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--woof-duration-fast);
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

/* Edit profile button */
.edit-profile-btn {
    padding: 6px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--woof-btn-radius);
    background: var(--color-surface);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}

.edit-profile-btn:hover {
    background: var(--color-bg-alt);
}

@media (max-width: 768px) {
    .profile-page {
        margin: -20px 0 0;
    }
    .profile-follow-sticky {
        bottom: 56px;
        padding: 12px 20px 12px;
    }
    .health-card-actions {
        opacity: 1;
    }
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
