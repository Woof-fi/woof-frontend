<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        checkinId = '',
        dogName = '',
        dogPhoto = '',
        dogSlug = '',
        dogId = '',
        parkName = '',
        parkSlug = '',
        note = null,
        plannedDurationMinutes = null,
        createdAt = '',
        isOwnCheckin = false,
        onOptionsClick = null,
    } = $props();

    function formatDuration(minutes) {
        if (!minutes) return '';
        if (minutes < 60) return `${minutes}min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }

    const FALLBACK_AVATAR = '/images/dog_profile_pic.jpg';

    let timeAgo = $derived(formatTimeAgo(createdAt));

    function formatTimeAgo(isoString) {
        if (!isoString) return '';
        const now = Date.now();
        const then = new Date(isoString).getTime();
        const diffMs = now - then;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return t('time.justNow');
        if (diffMin < 60) return t(diffMin === 1 ? 'time.oneMinute' : 'time.minutes', { count: diffMin });
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return t(diffHrs === 1 ? 'time.oneHour' : 'time.hours', { count: diffHrs });
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return t(diffDays === 1 ? 'time.oneDay' : 'time.days', { count: diffDays });
        const diffWeeks = Math.floor(diffDays / 7);
        return t(diffWeeks === 1 ? 'time.oneWeek' : 'time.weeks', { count: diffWeeks });
    }
</script>

<div class="checkin-card">
    <a href="/dog/{dogSlug}" data-link class="checkin-avatar-link">
        <img
            class="checkin-avatar"
            src={dogPhoto || FALLBACK_AVATAR}
            alt={dogName}
            onerror={(e) => { e.target.src = FALLBACK_AVATAR; }}
        />
    </a>
    <div class="checkin-content">
        <p class="checkin-text">
            <i class="fas fa-paw checkin-paw-icon"></i>
            <a href="/dog/{dogSlug}" data-link class="checkin-dog-name">{dogName}</a>
            <span class="checkin-action-text"> {t('feed.checkedInAt')} </span>
            <a href="/dog-park/{parkSlug}" data-link class="checkin-park-name">{parkName}</a>
            {#if plannedDurationMinutes}
                <span class="checkin-duration"> · ~{formatDuration(plannedDurationMinutes)}</span>
            {/if}
        </p>
        {#if note}
            <p class="checkin-note">"{note}"</p>
        {/if}
    </div>
    <span class="checkin-time">{timeAgo}</span>
    {#if onOptionsClick}
        <button
            class="checkin-options-btn"
            aria-label={t('checkin.options')}
            onclick={(e) => { e.stopPropagation(); onOptionsClick(); }}
        >
            <span class="btn-content"><i class="fas fa-ellipsis"></i></span>
        </button>
    {/if}
</div>

<style>
.checkin-card {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3) var(--woof-space-4);
    background: var(--woof-surface-primary);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    box-shadow: var(--woof-shadow-sm);
    margin: 0 auto 20px;
    max-width: 500px;
    width: 100%;
    box-sizing: border-box;
}

.checkin-avatar-link {
    flex-shrink: 0;
}

.checkin-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    display: block;
}

.checkin-content {
    flex: 1;
    min-width: 0;
}

.checkin-text {
    margin: 0;
    font-size: var(--woof-text-body);
    line-height: var(--woof-lh-body);
    color: var(--woof-color-neutral-700);
}

.checkin-paw-icon {
    color: var(--woof-color-brand-primary);
    opacity: 0.55;
    font-size: var(--woof-text-caption-1);
    margin-right: var(--woof-space-1);
}

.checkin-dog-name {
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    text-decoration: none;
}

.checkin-dog-name:hover {
    text-decoration: underline;
}

.checkin-action-text {
    color: var(--woof-color-neutral-500);
}

.checkin-park-name {
    color: var(--woof-color-brand-primary);
    font-weight: var(--woof-font-weight-medium);
    text-decoration: none;
}

.checkin-park-name:hover {
    text-decoration: underline;
}

.checkin-time {
    flex-shrink: 0;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    white-space: nowrap;
}

.checkin-duration {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
}

.checkin-note {
    margin: var(--woof-space-1) 0 0;
    font-size: var(--woof-text-caption-1);
    line-height: var(--woof-lh-caption);
    color: var(--woof-color-neutral-500);
    font-style: italic;
}

.checkin-options-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: var(--woof-space-1);
    cursor: pointer;
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-body);
    line-height: 1;
    border-radius: var(--woof-radius-sm);
    transition: color var(--woof-duration-fast);
}

.checkin-options-btn:hover {
    color: var(--woof-color-neutral-600);
}
</style>
