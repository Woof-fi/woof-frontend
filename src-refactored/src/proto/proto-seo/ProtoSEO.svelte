<script>
    const parks = [
        { name: 'Uutelan koirapuisto', address: 'Uutelantie 15, Helsinki', amenities: ['fence', 'water', 'lighting', 'parking'], size: 'large', visitors: 23 },
        { name: 'Arabian koira-aitaus', address: 'Arabiankatu 2, Helsinki', amenities: ['fence', 'water', 'separate_areas'], size: 'medium', visitors: 18 },
        { name: 'Paloheinän koirapuisto', address: 'Paloheinäntie 40, Helsinki', amenities: ['fence', 'lighting', 'parking'], size: 'large', visitors: 15 },
        { name: 'Pirkkolan koirapuisto', address: 'Pirkkolantie 6, Helsinki', amenities: ['fence', 'water', 'lighting'], size: 'medium', visitors: 12 },
        { name: 'Viikin koirapuisto', address: 'Viikintie 20, Helsinki', amenities: ['fence'], size: 'small', visitors: 9 },
    ];

    const amenityIcons = {
        fence: 'fa-shield-halved',
        water: 'fa-droplet',
        lighting: 'fa-lightbulb',
        parking: 'fa-map-pin',
        separate_areas: 'fa-dog',
    };

    const amenityLabels = {
        fence: 'Aidattu',
        water: 'Vesipiste',
        lighting: 'Valaistus',
        parking: 'Pysäköinti',
        separate_areas: 'Erilliset alueet',
    };

    const seoMeta = {
        title: 'Koirapuistot Helsinki — Woof',
        description: 'Löydä parhaat koirapuistot Helsingissä. Kartta, palvelut, arvostelut ja reaaliaikaiset kävijätiedot. 42 puistoa Helsingissä.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Koirapuistot Helsinki',
            numberOfItems: 42,
            itemListElement: parks.slice(0, 3).map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: { '@type': 'Park', name: p.name, address: p.address },
            })),
        },
    };
</script>

<div class="proto-seo">
    <h1 class="proto-title">SEO Park Pages</h1>
    <p class="proto-desc">Preview of <code>/koirapuistot/helsinki</code> — an SEO-optimized landing page for dog parks by city.</p>

    <!-- SEO Meta Preview -->
    <div class="seo-meta-card">
        <h3 class="seo-meta-heading">SEO Meta Tags</h3>
        <div class="seo-tag">
            <span class="seo-label">&lt;title&gt;</span>
            <span class="seo-value">{seoMeta.title}</span>
        </div>
        <div class="seo-tag">
            <span class="seo-label">&lt;meta description&gt;</span>
            <span class="seo-value">{seoMeta.description}</span>
        </div>
        <div class="seo-tag">
            <span class="seo-label">JSON-LD</span>
            <pre class="seo-json">{JSON.stringify(seoMeta.jsonLd, null, 2)}</pre>
        </div>
    </div>

    <!-- Page Preview -->
    <div class="page-preview">
        <div class="page-header">
            <nav class="breadcrumb">
                <a href="/proto/seo" data-link>Koirapuistot</a>
                <i class="fas fa-chevron-right" aria-hidden="true"></i>
                <span>Helsinki</span>
            </nav>
            <h2 class="page-title">Koirapuistot Helsinki</h2>
            <p class="page-subtitle">42 koirapuistoa Helsingissä. Aidatut puistot, palvelut ja kävijätiedot.</p>
        </div>

        <div class="parks-list">
            {#each parks as park, i (i)}
                <div class="park-card">
                    <div class="park-card-header">
                        <div class="park-photo-placeholder">
                            <i class="fas fa-image" aria-hidden="true"></i>
                        </div>
                        <div class="park-card-info">
                            <h3 class="park-card-name">{park.name}</h3>
                            <p class="park-card-address">
                                <i class="fas fa-location-dot" aria-hidden="true"></i>
                                {park.address}
                            </p>
                            <div class="park-card-badges">
                                <span class="size-badge">{park.size === 'large' ? 'Iso' : park.size === 'medium' ? 'Keskikokoinen' : 'Pieni'}</span>
                                <span class="visitors-badge">
                                    <i class="fas fa-dog" aria-hidden="true"></i>
                                    {park.visitors} kävijää/vko
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="park-amenities">
                        {#each park.amenities as amenity (amenity)}
                            <span class="amenity-chip">
                                <i class="fas {amenityIcons[amenity]}" aria-hidden="true"></i>
                                {amenityLabels[amenity]}
                            </span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
.proto-seo {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-5);
}

.proto-title {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    margin: 0;
}

.proto-desc {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.proto-desc code {
    background: var(--woof-color-neutral-100);
    padding: 1px var(--woof-space-1);
    border-radius: var(--woof-radius-xs);
    font-size: var(--woof-text-caption-1);
}

/* SEO Meta Card */
.seo-meta-card {
    background: var(--woof-color-neutral-900);
    border-radius: var(--woof-radius-lg);
    padding: var(--woof-space-4);
    color: var(--woof-color-neutral-200);
}

.seo-meta-heading {
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-400);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 var(--woof-space-3);
}

.seo-tag {
    margin-bottom: var(--woof-space-3);
}

.seo-label {
    display: block;
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-fresh-mint);
    font-family: monospace;
    margin-bottom: 2px;
}

.seo-value {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-100);
}

.seo-json {
    font-size: 11px;
    color: var(--woof-color-neutral-300);
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--woof-radius-sm);
    padding: var(--woof-space-2);
    margin: var(--woof-space-1) 0 0;
    overflow-x: auto;
    white-space: pre-wrap;
    line-height: 1.5;
}

/* Page Preview */
.page-preview {
    background: var(--woof-surface-primary);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
}

.page-header {
    padding: var(--woof-space-5) var(--woof-space-4);
    border-bottom: 1px solid var(--woof-color-neutral-200);
}

.breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    margin-bottom: var(--woof-space-2);
}

.breadcrumb a {
    color: var(--woof-color-brand-primary);
    text-decoration: none;
}

.breadcrumb i {
    font-size: 8px;
}

.page-title {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 var(--woof-space-1);
}

.page-subtitle {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.parks-list {
    display: flex;
    flex-direction: column;
}

.park-card {
    padding: var(--woof-space-4);
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.park-card:last-child {
    border-bottom: none;
}

.park-card-header {
    display: flex;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-2);
}

.park-photo-placeholder {
    width: 64px;
    height: 64px;
    border-radius: var(--woof-radius-md);
    background: var(--woof-color-neutral-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--woof-color-neutral-300);
    font-size: var(--woof-text-title-3);
    flex-shrink: 0;
}

.park-card-info {
    flex: 1;
    min-width: 0;
}

.park-card-name {
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 2px;
}

.park-card-address {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin: 0 0 var(--woof-space-1);
}

.park-card-address i {
    color: var(--woof-color-brand-primary);
    margin-right: 2px;
}

.park-card-badges {
    display: flex;
    gap: var(--woof-space-2);
    flex-wrap: wrap;
}

.size-badge {
    font-size: var(--woof-text-caption-2);
    padding: 1px var(--woof-space-2);
    background: var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-full);
    color: var(--woof-color-neutral-600);
}

.visitors-badge {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-400);
}

.park-amenities {
    display: flex;
    gap: var(--woof-space-1);
    flex-wrap: wrap;
}

.amenity-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--woof-text-caption-2);
    padding: 2px var(--woof-space-2);
    background: color-mix(in srgb, var(--woof-color-fresh-mint) 12%, transparent);
    color: var(--woof-color-fresh-mint-dark);
    border-radius: var(--woof-radius-full);
}
</style>
