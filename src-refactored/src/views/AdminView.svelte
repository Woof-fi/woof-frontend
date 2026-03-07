<script>
    import { getReports, updateReportStatus, adminDeletePost, adminDeleteComment, banUser, unbanUser, getFlaggedPosts, updatePostModeration, getAdminPendingParks, getAdminUnmatchedParks, updateAdminDogPark, deleteAdminDogPark, getAllTerritories, getAdminPendingAmenitySuggestions, reviewAmenitySuggestion } from '../../js/api.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { showToast, timeAgo } from '../../js/utils.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';

    let { params = {} } = $props();
    const VALID_SECTIONS = ['reports', 'flagged', 'dogparks'];
    let section = $derived(VALID_SECTIONS.includes(params.section) ? params.section : 'reports');

    function navigateSection(s) {
        history.pushState({}, '', `/admin/${s}`);
        window.dispatchEvent(new CustomEvent('routechange'));
    }

    let REASON_LABELS = $derived({
        inappropriate_content: t('post.reasonInappropriate'),
        spam:                  t('post.reasonSpam'),
        harassment:            t('post.reasonHarassment'),
        not_a_dog:             t('post.reasonNotDog'),
        violence:              t('post.reasonViolence'),
        other:                 t('post.reasonOther'),
    });

    let STATUS_FILTERS = $derived([
        { value: 'pending',   label: t('admin.pending') },
        { value: 'reviewed',  label: t('admin.reviewed') },
        { value: 'actioned',  label: t('admin.actioned') },
        { value: 'dismissed', label: t('admin.dismissed') },
        { value: '',          label: t('admin.all') },
    ]);

    let isAdmin      = $derived(store.authUser?.role === 'admin' || store.authUser?.role === 'moderator');
    let isAdminRole  = $derived(store.authUser?.role === 'admin');

    let statusFilter = $state('pending');
    let reports      = $state([]);
    let loading      = $state(true);
    let nextCursor   = $state(null);
    let loadingMore  = $state(false);

    // Per-report busy state keyed by report ID
    let busy = $state({});

    // ---- Flagged posts (Rekognition) ----
    let flaggedPosts    = $state([]);
    let flaggedLoading  = $state(false);
    let flaggedBusy     = $state({});

    // ---- Dog Parks ----
    let pendingParks     = $state([]);
    let unmatchedParks   = $state([]);
    let parksLoading     = $state(false);
    let parksBusy        = $state({});
    let allTerritories   = $state([]);
    let territoryAssignments = $state({});
    let parkEditing      = $state({});
    let parkEditNames    = $state({});
    let amenitySuggestions = $state([]);
    let amenityBusy      = $state({});

    function formatTerritoryLabel(terr) {
        if (terr.type === 'sub_district' && terr.parentName && terr.grandparentName) {
            return `${localName(terr)}, ${terr.parentName}, ${terr.grandparentName}`;
        }
        if (terr.type === 'district' && terr.parentName) {
            return `${localName(terr)}, ${terr.parentName}`;
        }
        return localName(terr);
    }

    $effect(() => {
        // Re-fetch reports when filter changes (only if in reports section)
        const _s = section;
        const _f = statusFilter;
        if (section === 'reports') {
            reports    = [];
            nextCursor = null;
            loading    = true;
            loadData();
        }
    });

    $effect(() => {
        // Load flagged posts when section switches to 'flagged'
        if (section === 'flagged') {
            loadFlaggedPosts();
        }
    });

    $effect(() => {
        if (section === 'dogparks') {
            loadDogParks();
        }
    });

    async function loadData() {
        try {
            const data = await getReports({ status: statusFilter || undefined, limit: 20 });
            reports    = data.reports ?? [];
            nextCursor = data.nextCursor ?? null;
        } catch (err) {
            showToast(err?.status === 403 ? t('admin.accessDenied') : t('admin.failedLoadReports'), 'error');
        } finally {
            loading = false;
        }
    }

    async function loadMore() {
        if (!nextCursor || loadingMore) return;
        loadingMore = true;
        try {
            const data = await getReports({ status: statusFilter || undefined, limit: 20, cursor: nextCursor });
            reports    = [...reports, ...(data.reports ?? [])];
            nextCursor = data.nextCursor ?? null;
        } catch {
            showToast(t('admin.failedLoadMore'), 'error');
        } finally {
            loadingMore = false;
        }
    }

    async function setStatus(report, status) {
        busy = { ...busy, [report.id]: true };
        try {
            await updateReportStatus(report.id, status);
            // Remove from list if it no longer matches filter
            if (statusFilter && status !== statusFilter) {
                reports = reports.filter(r => r.id !== report.id);
            } else {
                reports = reports.map(r => r.id === report.id ? { ...r, status } : r);
            }
            showToast(t('admin.reportUpdated'), 'success');
        } catch {
            showToast(t('admin.failedUpdateReport'), 'error');
        } finally {
            const next = { ...busy };
            delete next[report.id];
            busy = next;
        }
    }

    async function handleDeletePost(report) {
        busy = { ...busy, [report.id]: true };
        try {
            await adminDeletePost(report.target_id);
            await updateReportStatus(report.id, 'actioned');
            reports = reports.filter(r => r.id !== report.id);
            showToast(t('admin.postDeletedActioned'), 'success');
        } catch (err) {
            showToast(err?.status === 404 ? t('admin.postAlreadyDeleted') : t('admin.failedDeletePost'), 'error');
            // Still mark as actioned even if post was already gone
            try {
                await updateReportStatus(report.id, 'actioned');
                reports = reports.filter(r => r.id !== report.id);
            } catch { /* silent */ }
        } finally {
            const next = { ...busy };
            delete next[report.id];
            busy = next;
        }
    }

    async function handleDeleteComment(report) {
        busy = { ...busy, [report.id]: true };
        try {
            await adminDeleteComment(report.target_id);
            await updateReportStatus(report.id, 'actioned');
            reports = reports.filter(r => r.id !== report.id);
            showToast(t('admin.commentDeletedActioned'), 'success');
        } catch (err) {
            showToast(err?.status === 404 ? t('admin.commentAlreadyDeleted') : t('admin.failedDeleteComment'), 'error');
            try {
                await updateReportStatus(report.id, 'actioned');
                reports = reports.filter(r => r.id !== report.id);
            } catch { /* silent */ }
        } finally {
            const next = { ...busy };
            delete next[report.id];
            busy = next;
        }
    }

    async function handleBanUser(report) {
        const userId = report.post_owner_user_id || report.comment_owner_user_id;
        if (!userId) return;
        busy = { ...busy, [report.id]: true };
        try {
            await banUser(userId);
            // Update local ban state on the report
            reports = reports.map(r => {
                if (r.id !== report.id) return r;
                if (r.post_owner_user_id === userId) return { ...r, post_owner_banned_at: new Date().toISOString() };
                return { ...r, comment_owner_banned_at: new Date().toISOString() };
            });
            showToast(t('admin.userBanned'), 'success');
        } catch {
            showToast(t('admin.failedBan'), 'error');
        } finally {
            const next = { ...busy };
            delete next[report.id];
            busy = next;
        }
    }

    async function loadFlaggedPosts() {
        flaggedLoading = true;
        try {
            const data = await getFlaggedPosts();
            flaggedPosts = data.posts ?? [];
        } catch (err) {
            showToast(err?.status === 403 ? t('admin.accessDenied') : t('admin.failedLoadReports'), 'error');
        } finally {
            flaggedLoading = false;
        }
    }

    async function handleFlaggedAction(post, status) {
        flaggedBusy = { ...flaggedBusy, [post.id]: true };
        try {
            await updatePostModeration(post.id, status);
            flaggedPosts = flaggedPosts.filter(p => p.id !== post.id);
            showToast(status === 'approved' ? 'Post approved' : 'Post removed', 'success');
        } catch (err) {
            showToast(err?.status === 404 ? 'Post not found' : `Failed to ${status} post`, 'error');
        } finally {
            const next = { ...flaggedBusy };
            delete next[post.id];
            flaggedBusy = next;
        }
    }

    // ---- Dog Parks functions ----
    const parkTypeLabel = (type) => {
        const map = { all_sizes: 'dogPark.allSizes', small_dogs: 'dogPark.smallDogs', large_dogs: 'dogPark.largeDogs', separate_areas: 'dogPark.separateAreas' };
        return t(map[type] || 'dogPark.allSizes');
    };

    async function loadDogParks() {
        parksLoading = true;
        try {
            const [pending, unmatched, territories, suggestions] = await Promise.all([
                getAdminPendingParks(),
                getAdminUnmatchedParks(),
                allTerritories.length ? Promise.resolve(allTerritories) : getAllTerritories(),
                getAdminPendingAmenitySuggestions(),
            ]);
            pendingParks = pending;
            unmatchedParks = unmatched;
            amenitySuggestions = suggestions;
            if (!allTerritories.length) allTerritories = territories;
        } catch (err) {
            showToast(err?.status === 403 ? t('admin.accessDenied') : t('admin.failedLoadReports'), 'error');
        } finally {
            parksLoading = false;
        }
    }

    async function handleApprovePark(park) {
        parksBusy = { ...parksBusy, [park.id]: true };
        try {
            await updateAdminDogPark(park.id, { status: 'active' });
            pendingParks = pendingParks.filter(p => p.id !== park.id);
            showToast(t('admin.parkApproved'), 'success');
        } catch {
            showToast(t('admin.failedUpdateReport'), 'error');
        } finally {
            const next = { ...parksBusy };
            delete next[park.id];
            parksBusy = next;
        }
    }

    async function handleRejectPark(park) {
        parksBusy = { ...parksBusy, [park.id]: true };
        try {
            await deleteAdminDogPark(park.id);
            pendingParks = pendingParks.filter(p => p.id !== park.id);
            showToast(t('admin.parkRejected'), 'success');
        } catch {
            showToast(t('admin.failedUpdateReport'), 'error');
        } finally {
            const next = { ...parksBusy };
            delete next[park.id];
            parksBusy = next;
        }
    }

    async function handleAssignTerritory(park) {
        const territoryId = territoryAssignments[park.id];
        if (!territoryId) return;
        parksBusy = { ...parksBusy, [park.id]: true };
        try {
            await updateAdminDogPark(park.id, { territoryId });
            // Remove from unmatched list (if present), update in pending list (if present)
            unmatchedParks = unmatchedParks.filter(p => p.id !== park.id);
            pendingParks = pendingParks.map(p => p.id === park.id ? { ...p, territoryId } : p);
            showToast(t('admin.parkUpdated'), 'success');
        } catch {
            showToast(t('admin.failedUpdateReport'), 'error');
        } finally {
            const next = { ...parksBusy };
            delete next[park.id];
            parksBusy = next;
        }
    }

    function startParkEdit(park) {
        parkEditing = { ...parkEditing, [park.id]: true };
        parkEditNames = { ...parkEditNames, [park.id]: { name: park.name || '', nameFi: park.nameFi || '' } };
    }

    function cancelParkEdit(parkId) {
        const next = { ...parkEditing };
        delete next[parkId];
        parkEditing = next;
    }

    async function saveParkName(park) {
        const names = parkEditNames[park.id];
        if (!names?.name?.trim()) return;
        parksBusy = { ...parksBusy, [park.id]: true };
        try {
            await updateAdminDogPark(park.id, { name: names.name.trim(), nameFi: names.nameFi?.trim() || undefined });
            // Update local state
            const updateList = (list) => list.map(p => p.id === park.id ? { ...p, name: names.name.trim(), nameFi: names.nameFi?.trim() || p.nameFi } : p);
            pendingParks = updateList(pendingParks);
            unmatchedParks = updateList(unmatchedParks);
            cancelParkEdit(park.id);
            showToast(t('admin.parkUpdated'), 'success');
        } catch {
            showToast(t('admin.failedUpdateReport'), 'error');
        } finally {
            const next = { ...parksBusy };
            delete next[park.id];
            parksBusy = next;
        }
    }

    const AMENITY_LABELS = {
        fenced: 'dogPark.fenced', lighting: 'dogPark.lighting', trash_bins: 'dogPark.trashBins',
        water: 'dogPark.water', benches: 'dogPark.benches', agility: 'dogPark.agility', shelter: 'dogPark.shelter',
    };

    async function handleAmenityReview(suggestion, status) {
        amenityBusy = { ...amenityBusy, [suggestion.id]: true };
        try {
            await reviewAmenitySuggestion(suggestion.id, status);
            amenitySuggestions = amenitySuggestions.filter(s => s.id !== suggestion.id);
            showToast(t(status === 'approved' ? 'admin.amenityApproved' : 'admin.amenityRejected'), 'success');
        } catch {
            showToast(t('admin.failedUpdateReport'), 'error');
        } finally {
            const next = { ...amenityBusy };
            delete next[suggestion.id];
            amenityBusy = next;
        }
    }

    async function handleUnbanUser(report) {
        const userId = report.post_owner_user_id || report.comment_owner_user_id;
        if (!userId) return;
        busy = { ...busy, [report.id]: true };
        try {
            await unbanUser(userId);
            // Clear local ban state on the report
            reports = reports.map(r => {
                if (r.id !== report.id) return r;
                if (r.post_owner_user_id === userId) return { ...r, post_owner_banned_at: null };
                return { ...r, comment_owner_banned_at: null };
            });
            showToast(t('admin.userUnbanned'), 'success');
        } catch {
            showToast(t('admin.failedUnban'), 'error');
        } finally {
            const next = { ...busy };
            delete next[report.id];
            busy = next;
        }
    }
</script>

{#if !isAdmin}
    <div class="admin-access-denied">
        <i class="fas fa-lock"></i>
        <p>{t('admin.accessDenied')}</p>
    </div>
{:else}
    <div class="admin-view">
        <div class="admin-header">
            <h1 class="admin-title"><i class="fas fa-shield-halved"></i> Moderation</h1>
        </div>

        <!-- Top-level section tabs -->
        <div class="admin-section-tabs">
            <button
                class="admin-section-tab"
                class:active={section === 'reports'}
                onclick={() => navigateSection('reports')}
            >
                <i class="fas fa-flag"></i> {t('admin.reports')}
            </button>
            <button
                class="admin-section-tab"
                class:active={section === 'flagged'}
                onclick={() => navigateSection('flagged')}
            >
                <i class="fas fa-robot"></i> {t('admin.flagged')}
                {#if flaggedPosts.length > 0}
                    <span class="admin-section-badge">{flaggedPosts.length}</span>
                {/if}
            </button>
            <button
                class="admin-section-tab"
                class:active={section === 'dogparks'}
                onclick={() => navigateSection('dogparks')}
            >
                <i class="fas fa-tree"></i> {t('admin.dogParks')}
            </button>
        </div>

        {#if section === 'reports'}
            <div class="admin-filter-tabs">
                {#each STATUS_FILTERS as f}
                    <button
                        class="admin-filter-tab"
                        class:active={statusFilter === f.value}
                        onclick={() => statusFilter = f.value}
                    >
                        {f.label}
                    </button>
                {/each}
            </div>

            {#if loading}
                <div class="admin-loading">
                    <i class="fas fa-spinner fa-spin"></i> {t('admin.loadingReports')}
                </div>

            {:else if reports.length === 0}
                <div class="admin-empty">
                    <i class="fas fa-circle-check"></i>
                    <p>{t('admin.noReports', { status: statusFilter || '' })}</p>
                </div>

            {:else}
                <div class="admin-report-list">
                    {#each reports as report (report.id)}
                        <div class="admin-report-card" class:busy={busy[report.id]}>
                            <!-- Post preview (post reports only) -->
                            {#if report.target_type === 'post' && report.post_image_url}
                                <a href="/post/{report.target_id}" data-link class="admin-report-image">
                                    <img
                                        src={report.post_image_url}
                                        alt="Reported post"
                                    />
                                </a>
                            {:else if report.target_type === 'post'}
                                <a href="/post/{report.target_id}" data-link class="admin-report-image admin-report-image--text-only">
                                    <i class="fas fa-file-lines"></i>
                                </a>
                            {/if}

                            <div class="admin-report-body">
                                <div class="admin-report-meta">
                                    <span class="admin-reason-badge">{REASON_LABELS[report.reason] ?? report.reason}</span>
                                    <span class="admin-type-badge" class:admin-type-badge--comment={report.target_type === 'comment'}>
                                        {report.target_type === 'comment' ? 'Comment' : 'Post'}
                                    </span>
                                    <span class="admin-status-badge admin-status-{report.status}">{report.status}</span>
                                </div>

                                {#if report.target_type === 'post' && report.post_caption}
                                    <p class="admin-report-caption">"{report.post_caption}"</p>
                                {/if}

                                {#if report.target_type === 'comment' && report.comment_content}
                                    <blockquote class="admin-report-caption">"{report.comment_content}"</blockquote>
                                {/if}

                                {#if report.post_dog_name}
                                    <p class="admin-report-dog">
                                        <i class="fas fa-paw"></i>
                                        {#if report.post_dog_slug}
                                            <a href="/dog/{report.post_dog_slug}" data-link>{report.post_dog_name}</a>
                                        {:else}
                                            {report.post_dog_name}
                                        {/if}
                                        · <a href="/post/{report.target_id}" data-link class="admin-view-link">View post</a>
                                    </p>
                                {/if}

                                {#if report.target_type === 'comment' && report.comment_dog_name}
                                    <p class="admin-report-dog">
                                        <i class="fas fa-paw"></i>
                                        {#if report.comment_dog_slug}
                                            <a href="/dog/{report.comment_dog_slug}" data-link>{report.comment_dog_name}</a>
                                        {:else}
                                            {report.comment_dog_name}
                                        {/if}
                                        {#if report.comment_post_id}
                                            · <a href="/post/{report.comment_post_id}" data-link class="admin-view-link">View post</a>
                                        {/if}
                                    </p>
                                {/if}

                                <p class="admin-report-info">
                                    Reported by <strong>{report.reporter_email}</strong>
                                    · {timeAgo(report.created_at)}
                                </p>

                                {#if report.description}
                                    <p class="admin-report-description">{report.description}</p>
                                {/if}

                                <div class="admin-report-actions">
                                    {#if report.target_type === 'post'}
                                        <button
                                            class="admin-action-btn admin-action-btn--danger"
                                            disabled={!!busy[report.id]}
                                            onclick={() => handleDeletePost(report)}
                                        >
                                            <i class="fas fa-trash"></i> {t('admin.deletePost')}
                                        </button>
                                    {/if}
                                    {#if report.target_type === 'comment'}
                                        <button
                                            class="admin-action-btn admin-action-btn--danger"
                                            disabled={!!busy[report.id]}
                                            onclick={() => handleDeleteComment(report)}
                                        >
                                            <i class="fas fa-trash"></i> {t('admin.deleteComment')}
                                        </button>
                                    {/if}
                                    {#if isAdminRole && (report.post_owner_user_id || report.comment_owner_user_id)}
                                        {@const isBanned = !!(report.post_owner_banned_at || report.comment_owner_banned_at)}
                                        {#if isBanned}
                                            <button
                                                class="admin-action-btn admin-action-btn--neutral"
                                                disabled={!!busy[report.id]}
                                                onclick={() => handleUnbanUser(report)}
                                            >
                                                <i class="fas fa-user-check"></i> {t('admin.unbanUser')}
                                            </button>
                                        {:else}
                                            <button
                                                class="admin-action-btn admin-action-btn--danger"
                                                disabled={!!busy[report.id]}
                                                onclick={() => handleBanUser(report)}
                                            >
                                                <i class="fas fa-user-slash"></i> {t('admin.banUser')}
                                            </button>
                                        {/if}
                                    {/if}
                                    <button
                                        class="admin-action-btn admin-action-btn--neutral"
                                        disabled={!!busy[report.id]}
                                        onclick={() => setStatus(report, 'reviewed')}
                                    >
                                        <i class="fas fa-eye"></i> {t('admin.markReviewed')}
                                    </button>
                                    <button
                                        class="admin-action-btn admin-action-btn--muted"
                                        disabled={!!busy[report.id]}
                                        onclick={() => setStatus(report, 'dismissed')}
                                    >
                                        <i class="fas fa-times"></i> {t('admin.dismiss')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}

                    {#if nextCursor}
                        <button class="admin-load-more" onclick={loadMore} disabled={loadingMore}>
                            {loadingMore ? t('common.loadingEllipsis') : t('notifications.loadMore')}
                        </button>
                    {/if}
                </div>
            {/if}

        {:else if section === 'flagged'}
            {#if flaggedLoading}
                <div class="admin-loading">
                    <i class="fas fa-spinner fa-spin"></i> {t('admin.loadingFlagged')}
                </div>
            {:else if flaggedPosts.length === 0}
                <div class="admin-empty">
                    <i class="fas fa-robot"></i>
                    <p>{t('admin.noFlaggedPosts')}</p>
                </div>
            {:else}
                <div class="admin-flagged-grid">
                    {#each flaggedPosts as post (post.id)}
                        <div class="admin-flagged-card" class:busy={!!flaggedBusy[post.id]}>
                            <div class="admin-flagged-image">
                                {#if post.imageUrl}
                                    <img src={post.imageUrl} alt="Flagged post" />
                                {:else}
                                    <div class="admin-flagged-image--placeholder">
                                        <i class="fas fa-image"></i>
                                    </div>
                                {/if}
                            </div>
                            <div class="admin-flagged-body">
                                <p class="admin-flagged-dog">
                                    <i class="fas fa-paw"></i> {post.dogName}
                                </p>
                                <p class="admin-flagged-owner">{post.ownerName} · {post.ownerEmail}</p>
                                {#if post.caption}
                                    <p class="admin-flagged-caption">"{post.caption}"</p>
                                {/if}
                                <p class="admin-flagged-date">{timeAgo(post.createdAt)}</p>
                                <div class="admin-report-actions">
                                    <button
                                        class="admin-action-btn admin-action-btn--neutral"
                                        disabled={!!flaggedBusy[post.id]}
                                        onclick={() => handleFlaggedAction(post, 'approved')}
                                    >
                                        <i class="fas fa-check"></i> {t('admin.approve')}
                                    </button>
                                    <button
                                        class="admin-action-btn admin-action-btn--danger"
                                        disabled={!!flaggedBusy[post.id]}
                                        onclick={() => handleFlaggedAction(post, 'removed')}
                                    >
                                        <i class="fas fa-trash"></i> {t('admin.remove')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

        {:else if section === 'dogparks'}
            {#if parksLoading}
                <div class="admin-loading">
                    <i class="fas fa-spinner fa-spin"></i> {t('admin.loadingReports')}
                </div>
            {:else}
                <!-- Pending Suggestions -->
                <h2 class="admin-parks-heading">{t('admin.pendingParks')}</h2>
                {#if pendingParks.length === 0}
                    <div class="admin-empty admin-empty--compact">
                        <i class="fas fa-circle-check"></i>
                        <p>{t('admin.noPendingParks')}</p>
                    </div>
                {:else}
                    <div class="admin-parks-list">
                        {#each pendingParks as park (park.id)}
                            <div class="admin-park-card" class:busy={!!parksBusy[park.id]}>
                                <div class="admin-park-body">
                                    <div class="admin-report-meta">
                                        {#if parkEditing[park.id]}
                                            <div class="admin-park-edit-fields">
                                                <input
                                                    type="text"
                                                    class="admin-park-edit-input"
                                                    placeholder="Name (EN)"
                                                    value={parkEditNames[park.id]?.name || ''}
                                                    oninput={(e) => parkEditNames = { ...parkEditNames, [park.id]: { ...parkEditNames[park.id], name: e.target.value } }}
                                                />
                                                <input
                                                    type="text"
                                                    class="admin-park-edit-input"
                                                    placeholder="Nimi (FI)"
                                                    value={parkEditNames[park.id]?.nameFi || ''}
                                                    oninput={(e) => parkEditNames = { ...parkEditNames, [park.id]: { ...parkEditNames[park.id], nameFi: e.target.value } }}
                                                />
                                                <div class="admin-park-edit-actions">
                                                    <button class="admin-action-btn admin-action-btn--neutral" onclick={() => saveParkName(park)} disabled={!!parksBusy[park.id]}>
                                                        <i class="fas fa-floppy-disk"></i> Save
                                                    </button>
                                                    <button class="admin-action-btn" onclick={() => cancelParkEdit(park.id)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        {:else}
                                            <span class="admin-park-name">{localName(park)}</span>
                                            <button class="admin-park-edit-btn" onclick={() => startParkEdit(park)} title="Rename" aria-label="Edit park name">
                                                <i class="fas fa-pencil"></i>
                                            </button>
                                            <span class="admin-park-type-badge">{parkTypeLabel(park.parkType)}</span>
                                        {/if}
                                    </div>
                                    {#if park.address}
                                        <p class="admin-park-detail"><i class="fas fa-location-dot"></i> {park.address}</p>
                                    {/if}
                                    {#if park.description}
                                        <p class="admin-park-detail">{park.description}</p>
                                    {/if}
                                    {#if park.suggestedByEmail}
                                        <p class="admin-park-detail"><i class="fas fa-user"></i> {t('admin.suggestedBy')} {park.suggestedByEmail}</p>
                                    {/if}
                                    {#if park.latitude && park.longitude}
                                        <p class="admin-park-detail admin-park-coords"><i class="fas fa-compass"></i> {park.latitude.toFixed(5)}, {park.longitude.toFixed(5)}</p>
                                    {/if}
                                    <div class="admin-park-assign">
                                        <select
                                            class="admin-park-select"
                                            value={territoryAssignments[park.id] || park.territoryId || ''}
                                            onchange={(e) => territoryAssignments = { ...territoryAssignments, [park.id]: e.target.value }}
                                        >
                                            <option value="">{t('admin.assignTerritory')}</option>
                                            {#each allTerritories as terr}
                                                <option value={terr.id}>{formatTerritoryLabel(terr)}</option>
                                            {/each}
                                        </select>
                                        {#if territoryAssignments[park.id] && territoryAssignments[park.id] !== park.territoryId}
                                            <button
                                                class="admin-action-btn admin-action-btn--neutral"
                                                disabled={!!parksBusy[park.id]}
                                                onclick={() => handleAssignTerritory(park)}
                                                aria-label="Save territory assignment"
                                            >
                                                <i class="fas fa-floppy-disk"></i>
                                            </button>
                                        {/if}
                                    </div>
                                    <div class="admin-report-actions">
                                        <button
                                            class="admin-action-btn admin-action-btn--neutral"
                                            disabled={!!parksBusy[park.id]}
                                            onclick={() => handleApprovePark(park)}
                                        >
                                            <i class="fas fa-check"></i> {t('admin.approve')}
                                        </button>
                                        <button
                                            class="admin-action-btn admin-action-btn--danger"
                                            disabled={!!parksBusy[park.id]}
                                            onclick={() => handleRejectPark(park)}
                                        >
                                            <i class="fas fa-trash"></i> {t('admin.reject')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Unmatched Parks -->
                <h2 class="admin-parks-heading">{t('admin.unmatchedParks')}</h2>
                {#if unmatchedParks.length === 0}
                    <div class="admin-empty admin-empty--compact">
                        <i class="fas fa-location-dot"></i>
                        <p>{t('admin.noUnmatchedParks')}</p>
                    </div>
                {:else}
                    <div class="admin-parks-list">
                        {#each unmatchedParks as park (park.id)}
                            <div class="admin-park-card" class:busy={!!parksBusy[park.id]}>
                                <div class="admin-park-body">
                                    <div class="admin-report-meta">
                                        <span class="admin-park-name">{localName(park)}</span>
                                        <span class="admin-park-type-badge">{parkTypeLabel(park.parkType)}</span>
                                        {#if park.source === 'osm'}
                                            <span class="admin-type-badge">OSM</span>
                                        {/if}
                                    </div>
                                    {#if park.address}
                                        <p class="admin-park-detail"><i class="fas fa-location-dot"></i> {park.address}</p>
                                    {/if}
                                    {#if park.latitude && park.longitude}
                                        <p class="admin-park-detail admin-park-coords"><i class="fas fa-compass"></i> {park.latitude.toFixed(5)}, {park.longitude.toFixed(5)}</p>
                                    {/if}
                                    <div class="admin-park-assign">
                                        <select
                                            class="admin-park-select"
                                            value={territoryAssignments[park.id] || ''}
                                            onchange={(e) => territoryAssignments = { ...territoryAssignments, [park.id]: e.target.value }}
                                        >
                                            <option value="">{t('admin.assignTerritory')}</option>
                                            {#each allTerritories as terr}
                                                <option value={terr.id}>{formatTerritoryLabel(terr)}</option>
                                            {/each}
                                        </select>
                                        <button
                                            class="admin-action-btn admin-action-btn--neutral"
                                            disabled={!!parksBusy[park.id] || !territoryAssignments[park.id]}
                                            onclick={() => handleAssignTerritory(park)}
                                        >
                                            <i class="fas fa-floppy-disk"></i> Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Amenity Suggestions -->
                <h2 class="admin-parks-heading">{t('admin.amenitySuggestions')}</h2>
                {#if amenitySuggestions.length === 0}
                    <div class="admin-empty admin-empty--compact">
                        <i class="fas fa-clipboard-check"></i>
                        <p>{t('admin.noAmenitySuggestions')}</p>
                    </div>
                {:else}
                    <div class="admin-parks-list">
                        {#each amenitySuggestions as suggestion (suggestion.id)}
                            <div class="admin-park-card" class:busy={!!amenityBusy[suggestion.id]}>
                                <div class="admin-park-body">
                                    <div class="admin-report-meta">
                                        <span class="admin-park-name">{suggestion.park?.name || 'Unknown park'}</span>
                                    </div>
                                    <p class="admin-park-detail">
                                        <i class="fas fa-user"></i> {suggestion.userEmail}
                                    </p>
                                    <p class="admin-park-detail">
                                        <strong>{t(AMENITY_LABELS[suggestion.amenityKey] || suggestion.amenityKey)}</strong>
                                        → {suggestion.amenityValue ? 'Yes' : 'No'}
                                        {#if suggestion.park?.currentAmenities?.[suggestion.amenityKey] !== undefined}
                                            <span class="admin-amenity-current">({t('admin.currentValue')}: {suggestion.park.currentAmenities[suggestion.amenityKey] ? 'Yes' : 'No'})</span>
                                        {/if}
                                    </p>
                                    <div class="admin-report-actions">
                                        <button
                                            class="admin-action-btn admin-action-btn--neutral"
                                            disabled={!!amenityBusy[suggestion.id]}
                                            onclick={() => handleAmenityReview(suggestion, 'approved')}
                                        >
                                            <i class="fas fa-check"></i> {t('admin.approve')}
                                        </button>
                                        <button
                                            class="admin-action-btn admin-action-btn--danger"
                                            disabled={!!amenityBusy[suggestion.id]}
                                            onclick={() => handleAmenityReview(suggestion, 'rejected')}
                                        >
                                            <i class="fas fa-times"></i> {t('admin.reject')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
{/if}

<style>
.admin-access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-16);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-title-3);
}

.admin-view {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--woof-space-6) var(--woof-space-4) var(--woof-space-16);
}

.admin-header {
    margin-bottom: var(--woof-space-5);
}

.admin-title {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
}

.admin-title i {
    color: var(--woof-color-brand-primary);
}

.admin-filter-tabs {
    display: flex;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-5);
    flex-wrap: wrap;
}

.admin-filter-tab {
    padding: var(--woof-space-2) var(--woof-space-4);
    border-radius: var(--woof-radius-full);
    border: 1.5px solid var(--woof-color-neutral-200);
    background: var(--woof-color-neutral-0);
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-500);
    cursor: pointer;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast), border-color var(--woof-duration-fast);
}

.admin-filter-tab.active {
    background: var(--woof-color-neutral-900);
    border-color: var(--woof-color-neutral-900);
    color: var(--woof-color-neutral-0);
}

.admin-loading,
.admin-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-16) var(--woof-space-4);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-body);
}

.admin-empty i {
    font-size: 2.5rem;
    color: var(--woof-color-neutral-200);
}

.admin-report-list {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-4);
}

.admin-report-card {
    display: flex;
    gap: var(--woof-space-4);
    background: var(--woof-color-neutral-0);
    border: 1.5px solid var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-xl);
    padding: var(--woof-space-4);
    box-shadow: var(--woof-shadow-sm);
    transition: opacity var(--woof-duration-fast);
}

.admin-report-card.busy {
    opacity: 0.5;
    pointer-events: none;
}

.admin-report-image {
    flex-shrink: 0;
    width: 96px;
    height: 96px;
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
    background: var(--woof-color-neutral-100);
}

.admin-report-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.admin-report-image--text-only {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--woof-color-neutral-300);
    font-size: 2rem;
}

.admin-report-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.admin-report-meta {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    flex-wrap: wrap;
}

.admin-reason-badge {
    padding: var(--woof-space-1) var(--woof-space-3);
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
}

.admin-status-badge {
    padding: var(--woof-space-1) var(--woof-space-2);
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-caption-2);
    font-weight: var(--woof-font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.admin-status-pending   { background: var(--woof-color-amber-light); color: var(--woof-color-amber-text); }
.admin-status-reviewed  { background: var(--woof-color-neutral-100); color: var(--woof-color-neutral-600); }
.admin-status-actioned  { background: var(--woof-color-green-light);  color: var(--woof-color-green-text); }
.admin-status-dismissed { background: var(--woof-color-neutral-100); color: var(--woof-color-neutral-400); }

.admin-report-caption {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-700);
    font-style: italic;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin: 0;
}

.admin-report-dog {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.admin-report-dog a {
    color: var(--woof-color-brand-primary);
    text-decoration: none;
}

.admin-view-link {
    color: var(--woof-color-neutral-500);
    font-size: var(--woof-text-caption);
    text-decoration: none;
}

.admin-view-link:hover {
    text-decoration: underline;
    color: var(--woof-color-neutral-700);
}

:global(a.admin-report-image) {
    display: block;
    text-decoration: none;
    flex-shrink: 0;
}

.admin-report-info {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-400);
    margin: 0;
}

.admin-report-description {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-600);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-md);
    padding: var(--woof-space-2) var(--woof-space-3);
    margin: 0;
}

.admin-report-actions {
    display: flex;
    gap: var(--woof-space-2);
    flex-wrap: wrap;
    margin-top: var(--woof-space-1);
}

.admin-action-btn {
    padding: var(--woof-space-2) var(--woof-space-3);
    border-radius: var(--woof-radius-lg);
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-medium);
    cursor: pointer;
    border: 1.5px solid transparent;
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    transition: opacity var(--woof-duration-fast);
}

.admin-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.admin-action-btn--danger {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
}

.admin-action-btn--neutral {
    background: var(--woof-color-neutral-0);
    border-color: var(--woof-color-neutral-300);
    color: var(--woof-color-neutral-700);
}

.admin-action-btn--muted {
    background: var(--woof-color-neutral-0);
    border-color: var(--woof-color-neutral-200);
    color: var(--woof-color-neutral-400);
}

.admin-load-more {
    width: 100%;
    padding: var(--woof-space-3);
    border-radius: var(--woof-radius-xl);
    border: 1.5px solid var(--woof-color-neutral-200);
    background: var(--woof-color-neutral-0);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-600);
    cursor: pointer;
}

.admin-load-more:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.admin-type-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: 2px var(--woof-space-2);
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-caption);
    font-weight: var(--woof-font-weight-semibold);
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-700);
}

.admin-type-badge--comment {
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary);
}

/* Section tabs (Reports / Flagged) */
.admin-section-tabs {
    display: flex;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-5);
    border-bottom: 2px solid var(--woof-color-neutral-100);
    padding-bottom: 0;
}

.admin-section-tab {
    padding: var(--woof-space-2) var(--woof-space-4);
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    background: none;
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-500);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    transition: color var(--woof-duration-fast), border-color var(--woof-duration-fast);
}

.admin-section-tab.active {
    color: var(--woof-color-neutral-900);
    border-bottom-color: var(--woof-color-neutral-900);
    font-weight: var(--woof-font-weight-semibold);
}

.admin-section-badge {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-2);
    font-weight: var(--woof-font-weight-bold);
    min-width: 18px;
    height: 18px;
    border-radius: var(--woof-radius-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}

/* Flagged posts grid */
.admin-flagged-grid {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-4);
}

.admin-flagged-card {
    display: flex;
    gap: var(--woof-space-4);
    background: var(--woof-color-neutral-0);
    border: 1.5px solid var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-xl);
    padding: var(--woof-space-4);
    box-shadow: var(--woof-shadow-sm);
    transition: opacity var(--woof-duration-fast);
}

.admin-flagged-card.busy {
    opacity: 0.5;
    pointer-events: none;
}

.admin-flagged-image {
    flex-shrink: 0;
    width: 112px;
    height: 112px;
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
    background: var(--woof-color-neutral-100);
}

.admin-flagged-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.admin-flagged-image--placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--woof-color-neutral-300);
    font-size: 2rem;
}

.admin-flagged-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
}

.admin-flagged-dog {
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0;
}

.admin-flagged-owner {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.admin-flagged-caption {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-700);
    font-style: italic;
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.admin-flagged-date {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    margin: 0;
}

/* Dog Parks admin section */
.admin-parks-heading {
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: var(--woof-space-5) 0 var(--woof-space-3);
}

.admin-parks-heading:first-of-type {
    margin-top: 0;
}

.admin-empty--compact {
    padding: var(--woof-space-6) var(--woof-space-4);
}

.admin-parks-list {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-4);
}

.admin-park-card {
    background: var(--woof-color-neutral-0);
    border: 1.5px solid var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-xl);
    padding: var(--woof-space-4);
    box-shadow: var(--woof-shadow-sm);
    transition: opacity var(--woof-duration-fast);
}

.admin-park-card.busy {
    opacity: 0.5;
    pointer-events: none;
}

.admin-park-body {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.admin-park-name {
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.admin-park-type-badge {
    display: inline-block;
    padding: var(--woof-space-1) var(--woof-space-3);
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-fresh-mint);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
}

.admin-park-detail {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
}

.admin-park-coords {
    font-family: monospace;
    font-size: var(--woof-text-caption-1);
}

.admin-amenity-current {
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-caption-1);
    margin-left: var(--woof-space-1);
}

.admin-park-edit-btn {
    background: none;
    border: none;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    padding: var(--woof-space-1);
    font-size: 12px;
    border-radius: var(--woof-radius-sm);
    transition: color var(--woof-duration-fast), background var(--woof-duration-fast);
}

.admin-park-edit-btn:hover {
    color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-subtle);
}

.admin-park-edit-fields {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
    width: 100%;
}

.admin-park-edit-input {
    padding: var(--woof-space-2) var(--woof-space-3);
    border-radius: var(--woof-radius-md);
    border: 1.5px solid var(--woof-color-neutral-200);
    background: var(--woof-color-neutral-0);
    font-size: var(--woof-text-footnote);
    font-family: inherit;
    color: var(--woof-color-neutral-700);
    width: 100%;
    box-sizing: border-box;
}

.admin-park-edit-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
}

.admin-park-edit-actions {
    display: flex;
    gap: var(--woof-space-2);
}

.admin-park-assign {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    margin-top: var(--woof-space-1);
}

.admin-park-select {
    flex: 1;
    padding: var(--woof-space-2) var(--woof-space-3);
    border-radius: var(--woof-radius-lg);
    border: 1.5px solid var(--woof-color-neutral-200);
    background: var(--woof-color-neutral-0);
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-700);
}
</style>
