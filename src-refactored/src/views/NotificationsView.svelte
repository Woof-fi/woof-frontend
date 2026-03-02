<script>
    import { getNotifications, markNotificationsRead } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, imageVariant } from '../../js/utils.js';
    import { setNotifUnreadCount } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

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
            case 'like':       return t('notifications.liked');
            case 'comment':    return t('notifications.commented');
            case 'follow':     return t('notifications.followed');
            case 'park_visit': return `${t('notifications.parkVisit')}${notif.park?.name ? ` ${notif.park.name}` : ''}`;
            default:           return '';
        }
    }

    /** Navigate to the relevant resource when tapping a notification */
    function handleNotifClick(notif) {
        let href = null;
        if (notif.type === 'follow' && notif.actorDog?.slug) {
            href = `/dog/${notif.actorDog.slug}`;
        } else if (notif.type === 'park_visit' && notif.park?.slug) {
            href = `/dog-park/${notif.park.slug}`;
        } else if (notif.targetId && (notif.type === 'like' || notif.type === 'comment')) {
            href = `/post/${notif.targetId}`;
        }
        if (!href) return;
        history.pushState({}, '', href);
        window.dispatchEvent(new CustomEvent('routechange'));
    }
</script>

<style>
.notifications-view {
    max-width: 500px;
    margin: 0 auto;
    padding: var(--woof-space-4) 0;
}

.notifications-view-title {
    font-size: var(--woof-text-title-3);
    font-weight: var(--woof-font-weight-bold);
    color: var(--color-text);
    margin: 0 0 var(--woof-space-4);
    padding: 0 var(--woof-space-4);
}

.notification-list-card {
    border-radius: var(--woof-radius-xl);
    border: 1px solid var(--color-border);
    overflow: hidden;
    background: var(--color-surface);
    margin-bottom: var(--woof-space-4);
}

.notification-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
}

.notification-list li {
    display: contents; /* Let the button fill the list item visually */
}

.notification-item {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-4);
    background: var(--color-surface);
    border: none;
    border-bottom: 1px solid var(--color-border);
    border-radius: 0;
    text-align: left;
    text-decoration: none;
    color: var(--color-text);
    font-family: inherit;
    font-size: inherit;
    transition: background var(--woof-duration-fast);
    cursor: pointer;
    box-sizing: border-box;
}

.notification-list li:last-child .notification-item {
    border-bottom: none;
}

.notification-item:hover {
    background: var(--color-bg-alt);
}

.notification-item.unread {
    background: var(--woof-color-notif-unread-bg);
}

.notification-item.unread:hover {
    background: color-mix(in srgb, var(--woof-color-notif-unread-bg) 80%, var(--woof-color-neutral-200));
}

.notification-avatar {
    width: var(--woof-avatar-sm);
    height: var(--woof-avatar-sm);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
    background: var(--woof-color-neutral-200);
}

.notification-body {
    flex: 1;
    min-width: 0;
}

.notification-text {
    font-size: var(--woof-text-callout);
    line-height: 1.4;
    color: var(--color-text);
}

.notification-text strong {
    font-weight: var(--woof-font-weight-semibold);
}

.notification-time {
    display: block;
    font-size: var(--woof-text-footnote);
    color: var(--color-text-muted);
    margin-top: 2px;
}

.notification-thumb {
    width: 44px;
    height: 44px;
    border-radius: var(--woof-radius-sm);
    object-fit: cover;
    flex-shrink: 0;
    background: var(--woof-color-neutral-200);
}

.notifications-empty {
    text-align: center;
    padding: var(--woof-space-16) var(--woof-space-4);
    color: var(--color-text-muted);
    font-size: var(--woof-text-callout);
}

.notifications-empty i {
    font-size: 40px;
    display: block;
    margin-bottom: var(--woof-space-3);
    opacity: 0.4;
}

.notif-load-more {
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-4);
    background: none;
    border: none;
    border-top: 1px solid var(--color-border);
    color: var(--color-primary);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    cursor: pointer;
    transition: background var(--woof-duration-fast);
    font-family: inherit;
}

.notif-load-more:hover {
    background: var(--color-bg-alt);
}

.notif-load-more:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Skeleton rows for notifications loading */
.notification-skeleton {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3) var(--woof-space-4);
    border-bottom: 1px solid var(--color-border);
}

.notification-skeleton-avatar {
    width: var(--woof-avatar-sm);
    height: var(--woof-avatar-sm);
    border-radius: var(--woof-radius-full);
    flex-shrink: 0;
}

.notification-skeleton-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.notification-skeleton-line {
    height: 13px;
    border-radius: var(--woof-radius-xs);
}

.notification-skeleton-line.short {
    width: 40%;
}
</style>

<div class="notifications-view">
    <h1 class="notifications-view-title">{t('notifications.title')}</h1>

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
            <p>{t('notifications.empty')}</p>
            <p style="font-size: var(--woof-text-footnote);">
                {t('notifications.emptyHint')}
            </p>
        </div>
    {:else}
        <div class="notification-list-card">
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
                            alt={notif.actorDog?.name ?? t('notifications.userAvatar')}
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
                <button
                    class="notif-load-more"
                    onclick={loadMore}
                    disabled={loadingMore}
                >
                    {#if loadingMore}
                        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> {t('common.loadingEllipsis')}
                    {:else}
                        {t('notifications.loadMore')}
                    {/if}
                </button>
            {/if}
        </div>
    {/if}
</div>
