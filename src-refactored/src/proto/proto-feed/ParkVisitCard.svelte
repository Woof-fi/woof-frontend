<script>
    import { formatVisitTime, formatDuration } from '../mock-data.js';

    let { visit } = $props();

    let timeLabel = $derived(formatVisitTime(visit.arrivalAt));
    let durationLabel = $derived(formatDuration(visit.durationMinutes));
</script>

<div class="park-visit-card">
    <div class="visit-top">
        <img
            class="visit-avatar"
            src={visit.dog.profilePhoto}
            alt={visit.dog.name}
        />
        <div class="visit-info">
            <div class="visit-heading">
                <span class="visit-dog-name">{visit.dog.name}</span>
                <span class="visit-heading-text">heading to</span>
            </div>
            <div class="visit-park">
                <i class="fas fa-location-dot visit-park-icon"></i>
                <span class="visit-park-name">{visit.park.name}</span>
            </div>
            <div class="visit-time">
                {timeLabel} &mdash; ~{durationLabel}
            </div>
            {#if visit.note}
                <div class="visit-note">"{visit.note}"</div>
            {/if}
        </div>
    </div>
    <div class="visit-actions">
        <button class="visit-join-btn">
            <i class="fas fa-person-walking"></i> Join visit
        </button>
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
}

.visit-heading-text {
    color: var(--woof-color-neutral-500);
}

.visit-park {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    margin-top: var(--woof-space-1);
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

.visit-actions {
    margin-top: var(--woof-space-3);
    display: flex;
    justify-content: flex-end;
}

.visit-join-btn {
    background: none;
    border: 1.5px solid var(--woof-color-fresh-mint);
    color: var(--woof-color-fresh-mint-dark);
    border-radius: var(--woof-radius-full);
    padding: var(--woof-space-1) var(--woof-space-4);
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-semibold);
    font-family: var(--woof-font-family);
    cursor: pointer;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
}

.visit-join-btn:hover {
    background: var(--woof-color-fresh-mint-light);
    color: var(--woof-color-neutral-900);
}
</style>
