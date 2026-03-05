<script>
    let { territories = [] } = $props();
</script>

<section class="territory-activity">
    <h2 class="section-header">Your Territories</h2>

    <div class="territory-grid">
        {#each territories as t (t.territory)}
            <div class="territory-card">
                <div class="territory-name">{t.territory}</div>

                <div class="stat-row">
                    <i class="fas fa-camera stat-icon" aria-hidden="true"></i>
                    <span class="stat-label">Posts this week</span>
                    <span class="stat-value">{t.postsThisWeek}</span>
                </div>

                <div class="stat-row">
                    <i class="fas fa-paw stat-icon" aria-hidden="true"></i>
                    <span class="stat-label">New dogs</span>
                    <span class="stat-value">{t.newDogs}</span>
                </div>

                <div class="stat-row">
                    <i class="fas fa-calendar stat-icon" aria-hidden="true"></i>
                    <span class="stat-label">Upcoming visits</span>
                    <span class="stat-value">{t.upcomingVisits}</span>
                </div>
            </div>
        {/each}
    </div>
</section>

<style>
    .territory-activity {
        width: 100%;
    }

    .section-header {
        font-size: var(--woof-text-headline);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-900);
        margin: var(--woof-space-6) 0 var(--woof-space-3) 0;
    }

    .territory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: var(--woof-space-3);
    }

    .territory-card {
        background: var(--woof-color-neutral-50);
        border: 1px solid var(--woof-color-neutral-200);
        border-radius: var(--woof-radius-md);
        padding: var(--woof-space-4);
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-2);
    }

    .territory-name {
        font-weight: var(--woof-font-weight-semibold);
        font-size: var(--woof-text-callout);
        color: var(--woof-color-neutral-900);
        margin-bottom: var(--woof-space-1);
    }

    .stat-row {
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
        font-size: var(--woof-text-footnote);
        color: var(--woof-color-neutral-600);
    }

    .stat-icon {
        width: 16px;
        text-align: center;
        font-size: var(--woof-text-caption-1);
        color: var(--woof-color-neutral-400);
        flex-shrink: 0;
    }

    .stat-label {
        flex: 1;
    }

    .stat-value {
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-900);
        font-size: var(--woof-text-callout);
    }
</style>
