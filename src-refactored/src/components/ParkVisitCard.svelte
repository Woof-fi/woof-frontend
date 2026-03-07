<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let { visit } = $props();

    const FALLBACK_AVATAR = '/images/dog_profile_pic.jpg';

    let timeLabel = $derived(formatVisitTime(visit.arrivalAt));
    let durationLabel = $derived(formatDuration(visit.durationMinutes));

    function formatVisitTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        const time = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
        if (isToday) return `${t('feed.today')} ${time}`;
        if (isTomorrow) return `${t('feed.tomorrow')} ${time}`;
        return date.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'short' }) + ` ${time}`;
    }

    function formatDuration(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
</script>

<div class="park-visit-card">
    <div class="visit-top">
        <a href="/dog/{visit.dog.slug}" data-link>
            <img
                class="visit-avatar"
                src={visit.dog.profilePhoto || FALLBACK_AVATAR}
                alt={visit.dog.name}
            />
        </a>
        <div class="visit-info">
            <div class="visit-heading">
                <a href="/dog/{visit.dog.slug}" data-link class="visit-dog-name">{visit.dog.name}</a>
                <span class="visit-heading-text">{t('feed.headingTo')}</span>
            </div>
            <a href="/parks/{visit.park.slug}" data-link class="visit-park">
                <i class="fas fa-location-dot visit-park-icon"></i>
                <span class="visit-park-name">{visit.park.name}</span>
            </a>
            <div class="visit-time">
                {timeLabel} &mdash; ~{durationLabel}
            </div>
            {#if visit.note}
                <div class="visit-note">"{visit.note}"</div>
            {/if}
        </div>
    </div>
</div>

<style>
.park-visit-card {
    background: linear-gradient(135deg, color-mix(in srgb, var(--woof-color-fresh-mint-light) 15%, transparent), var(--woof-color-neutral-50));
    border-left: 4px solid var(--woof-color-fresh-mint);
    border-radius: var(--woof-radius-md);
    padding: var(--woof-space-4);
    max-width: 500px;
    margin: 0 auto var(--woof-space-3);
}

.visit-top {
    display: flex;
    gap: var(--woof-space-3);
}

.visit-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.visit-info {
    flex: 1;
    min-width: 0;
}

.visit-heading {
    font-size: var(--woof-text-callout);
    line-height: var(--woof-lh-callout);
    color: var(--woof-color-neutral-900);
}

.visit-dog-name {
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    text-decoration: none;
}

.visit-heading-text {
    color: var(--woof-color-neutral-500);
}

.visit-park {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    margin-top: var(--woof-space-1);
    text-decoration: none;
}

.visit-park-icon {
    color: var(--woof-color-fresh-mint-dark);
    font-size: var(--woof-text-footnote);
}

.visit-park-name {
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-800);
}

.visit-time {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin-top: var(--woof-space-1);
}

.visit-note {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-600);
    font-style: italic;
    margin-top: var(--woof-space-2);
    line-height: var(--woof-lh-footnote);
}
</style>
