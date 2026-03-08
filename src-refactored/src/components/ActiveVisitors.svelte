<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        checkins = [],
        loading = false,
    } = $props();

    function formatDuration(minutes) {
        if (minutes < 60) return `${minutes}min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
</script>

<div class="active-visitors">
    <div class="active-visitors-header">
        <div class="active-visitors-title">
            <span class="active-visitors-dot"></span>
            <h2 class="active-visitors-heading">{t('dogPark.activeNow')}</h2>
            {#if checkins.length > 0}
                <span class="active-visitors-count">{checkins.length}</span>
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="active-visitors-scroll">
            {#each [1, 2, 3] as _}
                <div class="active-visitor-skeleton">
                    <div class="active-visitor-skeleton-avatar woof-skeleton"></div>
                    <div class="active-visitor-skeleton-name woof-skeleton"></div>
                </div>
            {/each}
        </div>
    {:else if checkins.length > 0}
        <div class="active-visitors-scroll">
            {#each checkins as checkin (checkin.id)}
                <a
                    href="/dog/{checkin.dog?.slug || checkin.dogSlug}"
                    data-link
                    class="active-visitor"
                >
                    <img
                        src={checkin.dog?.profilePhoto || checkin.dogProfilePhoto || '/images/dog_profile_pic.jpg'}
                        alt={checkin.dog?.name || checkin.dogName || ''}
                        class="active-visitor-avatar"
                        onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                    />
                    <span class="active-visitor-name">
                        {checkin.dog?.name || checkin.dogName || ''}
                    </span>
                    {#if checkin.plannedDurationMinutes}
                        <span class="active-visitor-duration">~{formatDuration(checkin.plannedDurationMinutes)}</span>
                    {/if}
                    {#if checkin.note}
                        <span class="active-visitor-note">{checkin.note.length > 30 ? checkin.note.slice(0, 30) + '...' : checkin.note}</span>
                    {/if}
                </a>
            {/each}
        </div>
    {:else}
        <div class="active-visitors-empty">
            <i class="fas fa-paw"></i>
            <span>{t('dogPark.noActiveCheckins')}</span>
        </div>
    {/if}
</div>

<style>
.active-visitors {
    margin-bottom: var(--woof-space-5);
}

.active-visitors-header {
    margin-bottom: var(--woof-space-3);
}

.active-visitors-title {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
}

.active-visitors-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-success);
    flex-shrink: 0;
    animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

.active-visitors-heading {
    font-size: var(--woof-text-subheadline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-800);
    margin: 0;
}

.active-visitors-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-success);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    padding: 0 var(--woof-space-1);
}

/* Horizontal scroll row */
.active-visitors-scroll {
    display: flex;
    gap: var(--woof-space-3);
    overflow-x: auto;
    padding: var(--woof-space-1) 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.active-visitors-scroll::-webkit-scrollbar {
    display: none;
}

/* Individual visitor */
.active-visitor {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-1);
    text-decoration: none;
    flex-shrink: 0;
    min-width: 60px;
}

.active-visitor-avatar {
    width: var(--woof-space-12);
    height: var(--woof-space-12);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    border: 2px solid var(--woof-color-success);
    transition: transform var(--woof-duration-fast) ease;
}

.active-visitor:hover .active-visitor-avatar {
    transform: scale(1.08);
}

.active-visitor-name {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-700);
    font-weight: var(--woof-font-weight-medium);
    text-align: center;
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.active-visitor-duration {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-400);
    white-space: nowrap;
}

.active-visitor-note {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-400);
    font-style: italic;
    text-align: center;
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Skeleton states */
.active-visitor-skeleton {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-1);
    flex-shrink: 0;
}

.active-visitor-skeleton-avatar {
    width: var(--woof-space-12);
    height: var(--woof-space-12);
    border-radius: var(--woof-radius-full);
}

.active-visitor-skeleton-name {
    width: 48px;
    height: 12px;
    border-radius: var(--woof-radius-xs);
}

/* Empty state */
.active-visitors-empty {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-3) var(--woof-space-4);
    border: 1px dashed var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
}

.active-visitors-empty i {
    font-size: 16px;
}
</style>
