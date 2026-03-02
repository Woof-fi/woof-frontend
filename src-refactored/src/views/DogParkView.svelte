<script>
    import { getDogPark } from '../../js/api.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';

    let { params = {} } = $props();

    let park = $state(null);
    let loading = $state(true);
    let loadError = $state(false);

    const parkTypeLabel = (type) => {
        const map = { all_sizes: 'dogPark.allSizes', small_dogs: 'dogPark.smallDogs', large_dogs: 'dogPark.largeDogs', separate_areas: 'dogPark.separateAreas' };
        return t(map[type] || 'dogPark.allSizes');
    };

    $effect(() => {
        const slug = params.slug;
        if (!slug) return;

        park = null;
        loading = true;
        loadError = false;

        (async () => {
            try {
                park = await getDogPark(slug);
                loading = false;
            } catch (e) {
                loading = false;
                loadError = true;
                console.error('Failed to load dog park:', e);
            }
        })();
    });
</script>

<div class="dog-park-page">
    {#if loading}
        <div class="loading-container">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    {:else if loadError || !park}
        <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <p>{t('dogPark.failedLoad')}</p>
        </div>
    {:else}
        <!-- Hero image -->
        <div class="park-hero">
            {#if park.images && park.images.length > 0}
                <img src={park.images[0].imageUrl} alt={localName(park)} class="park-hero-img" />
            {:else}
                <div class="park-hero-placeholder">
                    <img src="/images/dog-park-placeholder.svg" alt="" class="park-hero-img" />
                </div>
            {/if}
        </div>

        <div class="park-content">
            <!-- Header -->
            <div class="park-header">
                <h1 class="park-name">{localName(park)}</h1>
                <span class="park-type-badge">{parkTypeLabel(park.parkType)}</span>
            </div>

            <!-- Territory breadcrumb -->
            {#if park.territory}
                <a href="/territory/{park.territory.path}" data-link class="park-territory-link">
                    <i class="fas fa-map-marker-alt"></i> {localName(park.territory)}
                </a>
            {/if}

            <!-- Address -->
            {#if park.address}
                <div class="park-detail-row">
                    <i class="fas fa-location-dot"></i>
                    <span>{park.address}</span>
                </div>
            {/if}

            <!-- Description -->
            {#if park.description || park.descriptionFi}
                <div class="park-description">
                    <p>{localName({ name: park.description, nameFi: park.descriptionFi }) || park.description}</p>
                </div>
            {/if}

            <!-- Coordinates -->
            {#if park.latitude && park.longitude}
                <div class="park-section">
                    <h2 class="park-section-title"><i class="fas fa-compass"></i> {t('dogPark.coordinates')}</h2>
                    <p class="park-coords">{park.latitude.toFixed(5)}, {park.longitude.toFixed(5)}</p>
                </div>
            {/if}

            <!-- Photos placeholder -->
            <div class="park-section">
                <h2 class="park-section-title"><i class="fas fa-camera"></i> {t('dogPark.photos')}</h2>
                {#if park.images && park.images.length > 0}
                    <div class="park-photos-grid">
                        {#each park.images as img (img.id)}
                            <div class="park-photo">
                                <img src={img.imageUrl} alt={img.caption || ''} loading="lazy" />
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="park-no-photos">
                        <i class="fas fa-image"></i>
                        <p>{t('dogPark.noPhotosYet')}</p>
                    </div>
                {/if}
            </div>

            <!-- OSM attribution -->
            {#if park.source === 'osm'}
                <div class="park-attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">
                        {t('dogPark.osmAttribution')}
                    </a>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
.dog-park-page {
    margin: -20px;
    min-height: 100vh;
}

.loading-container,
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: var(--woof-spacing-md);
    color: var(--woof-text-secondary);
}

.error-container i {
    font-size: 2rem;
    color: var(--woof-color-danger);
}

.park-hero {
    width: 100%;
    aspect-ratio: 16/9;
    background: var(--woof-bg-secondary);
    overflow: hidden;
}

.park-hero-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--woof-color-mint) 0%, var(--woof-bg-secondary) 100%);
}

.park-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.park-content {
    padding: var(--woof-spacing-lg);
    max-width: 640px;
    margin: 0 auto;
}

.park-header {
    display: flex;
    align-items: center;
    gap: var(--woof-spacing-sm);
    flex-wrap: wrap;
    margin-bottom: var(--woof-spacing-sm);
}

.park-name {
    font-size: var(--woof-text-title2);
    font-weight: var(--woof-font-weight-bold);
    margin: 0;
}

.park-type-badge {
    display: inline-block;
    background: var(--woof-color-mint);
    color: white;
    font-size: var(--woof-text-caption);
    font-weight: var(--woof-font-weight-semibold);
    padding: 2px 10px;
    border-radius: var(--woof-radius-full);
}

.park-territory-link {
    display: inline-block;
    color: var(--woof-color-primary);
    font-size: var(--woof-text-footnote);
    text-decoration: none;
    margin-bottom: var(--woof-spacing-md);
}

.park-territory-link:hover {
    text-decoration: underline;
}

.park-detail-row {
    display: flex;
    align-items: center;
    gap: var(--woof-spacing-xs);
    color: var(--woof-text-secondary);
    font-size: var(--woof-text-body);
    margin-bottom: var(--woof-spacing-md);
}

.park-description {
    margin-bottom: var(--woof-spacing-lg);
    color: var(--woof-text-primary);
    line-height: 1.6;
}

.park-section {
    margin-bottom: var(--woof-spacing-lg);
}

.park-section-title {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    margin: 0 0 var(--woof-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--woof-spacing-xs);
}

.park-coords {
    color: var(--woof-text-secondary);
    font-family: monospace;
    font-size: var(--woof-text-footnote);
    margin: 0;
}

.park-photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--woof-spacing-sm);
}

.park-photo img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--woof-radius-md);
}

.park-no-photos {
    text-align: center;
    padding: var(--woof-spacing-xl);
    color: var(--woof-text-tertiary);
    background: var(--woof-bg-secondary);
    border-radius: var(--woof-radius-lg);
}

.park-no-photos i {
    font-size: 2rem;
    margin-bottom: var(--woof-spacing-sm);
    display: block;
}

.park-attribution {
    text-align: center;
    padding: var(--woof-spacing-md);
    font-size: var(--woof-text-caption);
    color: var(--woof-text-tertiary);
}

.park-attribution a {
    color: var(--woof-text-tertiary);
    text-decoration: none;
}

.park-attribution a:hover {
    text-decoration: underline;
}
</style>
