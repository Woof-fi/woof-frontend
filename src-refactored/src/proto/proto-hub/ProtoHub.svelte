<script>
    const prototypes = [
        {
            name: 'emails',
            title: 'Email Templates',
            desc: 'Transactional and digest email templates: welcome onboarding, new follower notifications, and weekly territory highlights. Finnish mock data.',
            icon: 'fa-envelope',
            color: 'var(--woof-color-brand-primary)',
        },
        {
            name: 'seo',
            title: 'SEO Park Pages',
            desc: 'SEO-optimized landing pages for dog parks by city. Structured data, meta tags, amenity icons, and visitor stats for search engine visibility.',
            icon: 'fa-magnifying-glass',
            color: 'var(--woof-color-fresh-mint-dark)',
        },
        {
            name: 'feedback',
            title: 'Feedback & Broadcasts',
            desc: 'In-app feedback modal (bug reports, feature requests) and admin broadcast notification system. Preview the full user flow.',
            icon: 'fa-comment-dots',
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
