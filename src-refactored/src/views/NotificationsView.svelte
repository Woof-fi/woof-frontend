<script>
    import { getNotifications, markNotificationsRead } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, imageVariant } from '../../js/utils.js';
    import { setNotifUnreadCount } from '../../js/svelte-store.svelte.js';

    let { onopenAuthModal = null } = $props();

    let notifications = $state([]);
    let loading = $state(true);
    let nextCursor = $state(null);
    let loadingMore = $state(false);

    const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23cccccc" width="40" height="40" rx="20"/%3E%3C/svg%3E';

    $effect(() => {
        if (!isAuthenticated()) {
            loading = false;
            onopenAuthModal?.();
            return;
        }

        let active = true;

        (async () => {
            try {
                const result = await getNotifications(null, 20);
                if (!active) return;
                notifications = result.notifications ?? [];
                nextCursor = result.nextCursor ?? null;
            } catch {
                if (!active) return;
                notifications = [];
            } finally {
                if (active) loading = false;
            }

            // Mark all as read after fetching — fire and forget
            markNotificationsRead()
                .then(() => setNotifUnreadCount(0))
                .catch(() => {});
        })();

        return () => { active = false; };
    });

    async function loadMore() {
        if (!nextCursor || loadingMore) return;
        loadingMore = true;
        try {
            const result = await getNotifications(nextCursor, 20);
            notifications = [...notifications, ...(result.notifications ?? [])];
            nextCursor = result.nextCursor ?? null;
        } catch {
            // Silently fail — user can retry
        } finally {
            loadingMore = false;
        }
    }

    /** Human-readable notification text (without the actor name prefix) */
    function notifText(notif) {
        switch (notif.type) {
            case 'like':    return 'liked your post';
            case 'comment': return 'commented on your post';
            case 'follow':  return 'started following you';
            default:        return '';
        }
    }

    /** Navigate to the relevant resource when tapping a notification */
    function handleNotifClick(notif) {
        let href = null;
        if (notif.type === 'follow' && notif.actorDog?.slug) {
            href = `/dog/${notif.actorDog.slug}`;
        } else if (notif.targetId && (notif.type === 'like' || notif.type === 'comment')) {
            href = `/post/${notif.targetId}`;
        }
        if (!href) return;
        history.pushState({}, '', href);
        window.dispatchEvent(new CustomEvent('routechange'));
    }
</script>

<div class="notifications-view">
    <h1 class="notifications-view-title">Notifications</h1>

    {#if loading}
        {#each Array(6) as _, i (i)}
            <div class="notification-skeleton">
                <div class="notification-skeleton-avatar woof-skeleton"></div>
                <div class="notification-skeleton-body">
                    <div class="notification-skeleton-line woof-skeleton"></div>
                    <div class="notification-skeleton-line short woof-skeleton"></div>
                </div>
            </div>
        {/each}
    {:else if notifications.length === 0}
        <div class="notifications-empty">
            <i class="fas fa-bell" aria-hidden="true"></i>
            <p>No notifications yet</p>
            <p style="font-size: var(--woof-text-footnote);">
                When someone likes your post or follows you, it'll show up here.
            </p>
        </div>
    {:else}
        <ul class="notification-list">
            {#each notifications as notif (notif.id)}
                <li>
                <button
                    type="button"
                    class="notification-item"
                    class:unread={!notif.read}
                    onclick={() => handleNotifClick(notif)}
                    aria-label="{notif.actorDog?.name ?? 'Someone'} {notifText(notif)}"
                >
                    <img
                        src={notif.actorDog?.profilePhoto || FALLBACK_AVATAR}
                        alt={notif.actorDog?.name ?? 'User avatar'}
                        class="notification-avatar"
                        onerror={(e) => { e.target.src = FALLBACK_AVATAR; }}
                    />

                    <div class="notification-body">
                        <span class="notification-text">
                            <strong>{notif.actorDog?.name ?? 'Someone'}</strong>
                            {' '}{notifText(notif)}
                        </span>
                        <time
                            class="notification-time"
                            datetime={new Date(notif.createdAt).toISOString()}
                        >
                            {timeAgo(notif.createdAt)}
                        </time>
                    </div>

                    {#if notif.postImageUrl && (notif.type === 'like' || notif.type === 'comment')}
                        <img
                            src={imageVariant(notif.postImageUrl, 'thumb')}
                            alt="Post thumbnail"
                            class="notification-thumb"
                            onerror={(e) => { e.target.style.display = 'none'; }}
                        />
                    {/if}
                </button>
                </li>
            {/each}
        </ul>

        {#if nextCursor}
            <div style="padding: var(--woof-space-4);">
                <button
                    class="admin-load-more"
                    onclick={loadMore}
                    disabled={loadingMore}
                >
                    {#if loadingMore}
                        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Loading…
                    {:else}
                        Load more
                    {/if}
                </button>
            </div>
        {/if}
    {/if}
</div>
