<script>
    const prototypes = [
        {
            name: 'create',
            title: 'Unified Create Button',
            desc: 'The + button opens a menu: post a photo, schedule a park visit, or log a health record. Surfaces hidden features from the main action button.',
            icon: 'fa-plus-circle',
            color: 'var(--woof-color-brand-primary)',
        },
        {
            name: 'feed',
            title: 'Personalized Feed',
            desc: 'Two-tab feed: "Following" shows posts from dogs you follow, scheduled visits at your parks, and new dogs in your districts. "All" shows everything else.',
            icon: 'fa-stream',
            color: 'var(--woof-color-fresh-mint-dark)',
        },
        {
            name: 'dashboard',
            title: 'Dashboard Home',
            desc: 'Replace the feed-only home with a dashboard: upcoming visits, territory activity, nearby parks, and a mini feed below.',
            icon: 'fa-th-large',
            color: 'var(--woof-color-gold)',
        },
    ];
</script>

<div class="hub">
    <h1 class="hub-title">Woof Prototypes</h1>
    <p class="hub-subtitle">Explore product concepts. These use mock data — nothing affects the real app.</p>

    <div class="hub-grid">
        {#each prototypes as proto}
            <a href="/proto/{proto.name}" data-link class="hub-card">
                <div class="hub-card-icon" style="color: {proto.color}">
                    <i class="fas {proto.icon}"></i>
                </div>
                <h2 class="hub-card-title">{proto.title}</h2>
                <p class="hub-card-desc">{proto.desc}</p>
                <span class="hub-card-cta">Try it <i class="fas fa-arrow-right"></i></span>
            </a>
        {/each}
    </div>
</div>

<style>
.hub-title {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    margin: var(--woof-space-4) 0 var(--woof-space-2);
}

.hub-subtitle {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0 0 var(--woof-space-6);
}

.hub-grid {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-4);
}

.hub-card {
    display: block;
    background: var(--woof-surface-primary);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    padding: var(--woof-space-6);
    text-decoration: none;
    transition: box-shadow var(--woof-duration-fast), transform var(--woof-duration-fast);
}

.hub-card:hover {
    box-shadow: var(--woof-shadow-md);
    transform: translateY(-2px);
}

.hub-card-icon {
    font-size: 32px;
    margin-bottom: var(--woof-space-3);
}

.hub-card-title {
    font-size: var(--woof-text-title-3);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 var(--woof-space-2);
}

.hub-card-desc {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0 0 var(--woof-space-4);
    line-height: var(--woof-lh-callout);
}

.hub-card-cta {
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-brand-primary);
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
}
</style>
