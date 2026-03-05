<script>
    import { formatVisitTime, formatDuration } from '../mock-data.js';

    let { visits = [] } = $props();
</script>

<section class="upcoming-visits">
    <h2 class="section-header">
        Upcoming Visits
        <span class="count-badge">{visits.length}</span>
    </h2>

    <div class="scroll-container">
        {#each visits as visit (visit.id)}
            <div class="visit-card">
                <div class="visit-park-name" title={visit.park.name}>
                    {visit.park.name}
                </div>

                <div class="visit-dog">
                    <img
                        class="visit-dog-avatar"
                        src={visit.dog.profilePhoto}
                        alt={visit.dog.name}
                    />
                    <span class="visit-dog-name">{visit.dog.name}</span>
                </div>

                <div class="visit-time">
                    <i class="far fa-clock visit-icon" aria-hidden="true"></i>
                    {formatVisitTime(visit.arrivalAt)}
                </div>

                <div class="visit-duration">
                    <i class="far fa-hourglass visit-icon" aria-hidden="true"></i>
                    ~{formatDuration(visit.durationMinutes)}
                </div>

                {#if visit.note}
                    <div class="visit-note" title={visit.note}>
                        {visit.note}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</section>

<style>
    .upcoming-visits {
        width: 100%;
    }

    .section-header {
        font-size: var(--woof-text-headline);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-900);
        margin: var(--woof-space-6) 0 var(--woof-space-3) 0;
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
    }

    .count-badge {
        font-size: var(--woof-text-caption-1);
        font-weight: var(--woof-font-weight-medium);
        color: var(--woof-color-neutral-500);
        background: var(--woof-color-neutral-100);
        padding: 2px var(--woof-space-2);
        border-radius: var(--woof-radius-full);
        line-height: 1.4;
    }

    .scroll-container {
        display: flex;
        gap: var(--woof-space-3);
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -ms-overflow-style: none;
        scrollbar-width: none;
        padding-bottom: var(--woof-space-1);
    }

    .scroll-container::-webkit-scrollbar {
        display: none;
    }

    .visit-card {
        flex: 0 0 200px;
        scroll-snap-align: start;
        background: var(--woof-surface-primary);
        border: 1px solid var(--woof-color-neutral-200);
        border-radius: var(--woof-radius-md);
        padding: var(--woof-space-4);
        box-shadow: var(--woof-shadow-xs);
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-2);
    }

    .visit-park-name {
        font-weight: var(--woof-font-weight-semibold);
        font-size: var(--woof-text-callout);
        color: var(--woof-color-neutral-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
    }

    .visit-dog {
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
    }

    .visit-dog-avatar {
        width: 28px;
        height: 28px;
        border-radius: var(--woof-radius-full);
        object-fit: cover;
        flex-shrink: 0;
    }

    .visit-dog-name {
        font-size: var(--woof-text-footnote);
        color: var(--woof-color-neutral-700);
        font-weight: var(--woof-font-weight-medium);
    }

    .visit-time,
    .visit-duration {
        font-size: var(--woof-text-caption-1);
        color: var(--woof-color-neutral-500);
        display: flex;
        align-items: center;
        gap: var(--woof-space-1);
    }

    .visit-icon {
        font-size: var(--woof-text-caption-2);
        width: 14px;
        text-align: center;
        flex-shrink: 0;
    }

    .visit-note {
        font-size: var(--woof-text-caption-1);
        color: var(--woof-color-neutral-400);
        font-style: italic;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-top: 1px solid var(--woof-color-neutral-100);
        padding-top: var(--woof-space-2);
        margin-top: var(--woof-space-1);
    }
</style>
