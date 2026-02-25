<script>
    import { getReports, updateReportStatus, adminDeletePost, adminDeleteComment, banUser, unbanUser } from '../../js/api.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { showToast, timeAgo } from '../../js/utils.js';

    const REASON_LABELS = {
        inappropriate_content: 'Inappropriate content',
        spam:                  'Spam',
        harassment:            'Harassment',
        not_a_dog:             'Not a dog',
        violence:              'Violence',
        other:                 'Other',
    };

    const STATUS_FILTERS = [
        { value: 'pending',   label: 'Pending' },
        { value: 'reviewed',  label: 'Reviewed' },
        { value: 'actioned',  label: 'Actioned' },
        { value: 'dismissed', label: 'Dismissed' },
        { value: '',          label: 'All' },
    ];

    let isAdmin      = $derived(store.authUser?.role === 'admin' || store.authUser?.role === 'moderator');
    let isAdminRole  = $derived(store.authUser?.role === 'admin');

    let statusFilter = $state('pending');
    let reports      = $state([]);
    let loading      = $state(true);
    let nextCursor   = $state(null);
    let loadingMore  = $state(false);

    // Per-report busy state keyed by report ID
    let busy = $state({});

    $effect(() => {
        // Re-fetch when filter changes
        const _f = statusFilter;
        reports    = [];
        nextCursor = null;
        loading    = true;
        loadData();
    });

    async function loadData() {
        try {
            const data = await getReports({ status: statusFilter || undefined, limit: 20 });
            reports    = data.reports ?? [];
            nextCursor = data.nextCursor ?? null;
        } catch (err) {
            showToast(err?.status === 403 ? 'Access denied' : 'Failed to load reports', 'error');
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
            showToast('Failed to load more reports', 'error');
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
            showToast('Report updated', 'success');
        } catch {
            showToast('Failed to update report', 'error');
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
            showToast('Post deleted and report actioned', 'success');
        } catch (err) {
            showToast(err?.status === 404 ? 'Post already deleted' : 'Failed to delete post', 'error');
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
            showToast('Comment deleted and report actioned', 'success');
        } catch (err) {
            showToast(err?.status === 404 ? 'Comment already deleted' : 'Failed to delete comment', 'error');
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
            showToast('User banned', 'success');
        } catch {
            showToast('Failed to ban user', 'error');
        } finally {
            const next = { ...busy };
            delete next[report.id];
            busy = next;
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
            showToast('User unbanned', 'success');
        } catch {
            showToast('Failed to unban user', 'error');
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
        <p>Access denied</p>
    </div>
{:else}
    <div class="admin-view">
        <div class="admin-header">
            <h1 class="admin-title"><i class="fas fa-shield-alt"></i> Moderation</h1>
        </div>

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
                <i class="fas fa-spinner fa-spin"></i> Loading reports…
            </div>

        {:else if reports.length === 0}
            <div class="admin-empty">
                <i class="fas fa-check-circle"></i>
                <p>No {statusFilter || ''} reports</p>
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
                                <i class="fas fa-file-alt"></i>
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
                                        <i class="fas fa-trash"></i> Delete post
                                    </button>
                                {/if}
                                {#if report.target_type === 'comment'}
                                    <button
                                        class="admin-action-btn admin-action-btn--danger"
                                        disabled={!!busy[report.id]}
                                        onclick={() => handleDeleteComment(report)}
                                    >
                                        <i class="fas fa-trash"></i> Delete comment
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
                                            <i class="fas fa-user-check"></i> Unban user
                                        </button>
                                    {:else}
                                        <button
                                            class="admin-action-btn admin-action-btn--danger"
                                            disabled={!!busy[report.id]}
                                            onclick={() => handleBanUser(report)}
                                        >
                                            <i class="fas fa-user-slash"></i> Ban user
                                        </button>
                                    {/if}
                                {/if}
                                <button
                                    class="admin-action-btn admin-action-btn--neutral"
                                    disabled={!!busy[report.id]}
                                    onclick={() => setStatus(report, 'reviewed')}
                                >
                                    <i class="fas fa-eye"></i> Mark reviewed
                                </button>
                                <button
                                    class="admin-action-btn admin-action-btn--muted"
                                    disabled={!!busy[report.id]}
                                    onclick={() => setStatus(report, 'dismissed')}
                                >
                                    <i class="fas fa-times"></i> Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}

                {#if nextCursor}
                    <button class="admin-load-more" onclick={loadMore} disabled={loadingMore}>
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
{/if}
