<script>
    import { getAllBreeds, getPopularBreeds } from '../../js/api.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';
    import { showToast } from '../../js/utils.js';

    let allBreeds = $state([]);
    let popularBreeds = $state([]);
    let loading = $state(true);
    let query = $state('');

    let filteredBreeds = $derived(
        query.length > 0
            ? allBreeds.filter(b =>
                b.name.toLowerCase().includes(query.toLowerCase()) ||
                (b.nameFi && b.nameFi.toLowerCase().includes(query.toLowerCase()))
            )
            : allBreeds
    );

    $effect(() => {
        let active = true;
        (async () => {
            try {
                const [breeds, popular] = await Promise.all([
                    getAllBreeds(),
                    getPopularBreeds()
                ]);
                if (!active) return;
                allBreeds = breeds;
                popularBreeds = popular;
            } catch (e) {
                console.error('Failed to load breeds:', e);
                showToast(t('common.failedLoad'), 'error');
            } finally {
                if (active) loading = false;
            }
        })();
        return () => { active = false; };
    });
</script>

<div class="breed-directory">
    <div class="breed-directory-header">
        <h1>{t('breedDirectory.title')}</h1>
        <p class="breed-directory-subtitle">{t('breedDirectory.subtitle')}</p>
    </div>

    <div class="breed-directory-search">
        <i class="fas fa-magnifying-glass"></i>
        <input
            type="text"
            placeholder={t('breedDirectory.searchPlaceholder')}
            bind:value={query}
        />
    </div>

    {#if loading}
        <div class="breed-directory-loading"><i class="fas fa-spinner fa-spin"></i> {t('breedDirectory.loading')}</div>
    {:else}
        {#if !query && popularBreeds.length > 0}
            <section class="breed-section">
                <h2 class="breed-section-title">{t('breedDirectory.popularBreeds')}</h2>
                <div class="breed-popular-grid">
                    {#each popularBreeds as breed (breed.id)}
                        <a href="/breed/{breed.slug}" data-link class="breed-popular-card">
                            <div class="breed-popular-icon">
                                <i class="fas fa-paw"></i>
                            </div>
                            <span class="breed-popular-name">{localName(breed)}</span>
                            <span class="breed-popular-count">{breed.dogCount === 1 ? t('breedDirectory.dogSingular', { count: breed.dogCount }) : t('breedDirectory.dogCount', { count: breed.dogCount })}</span>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}

        <section class="breed-section">
            <h2 class="breed-section-title">
                {query ? t('breedDirectory.resultsFor', { query }) : t('breedDirectory.allBreeds')}
                <span class="breed-section-count">{filteredBreeds.length}</span>
            </h2>
            {#if filteredBreeds.length === 0}
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon">
                        <i class="fas fa-magnifying-glass"></i>
                    </div>
                    <p>{t('breedDirectory.noResults', { query })}</p>
                </div>
            {:else}
                <ul class="breed-alpha-list">
                    {#each filteredBreeds as breed (breed.id)}
                        <li>
                            <a href="/breed/{breed.slug}" data-link class="breed-alpha-item">
                                <i class="fas fa-paw breed-alpha-icon"></i>
                                <div class="breed-alpha-info">
                                    <span class="breed-alpha-name">{localName(breed)}</span>
                                </div>
                                <i class="fas fa-chevron-right breed-alpha-arrow"></i>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {/if}
</div>

<style>
.breed-directory {
    max-width: 640px;
    margin: 0 auto;
    padding: 0 0 40px;
}

.breed-directory-header {
    margin-bottom: 20px;
}

.breed-directory-header h1 {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    margin: 0 0 4px;
    color: var(--woof-color-neutral-900);
}

.breed-directory-subtitle {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.breed-directory-search {
    position: relative;
    margin-bottom: 24px;
}

.breed-directory-search i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--woof-color-neutral-400);
    font-size: 14px;
}

.breed-directory-search input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    font-size: var(--woof-text-body);
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-900);
    box-sizing: border-box;
}

.breed-directory-search input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    box-shadow: 0 0 0 3px var(--woof-color-brand-primary-subtle);
}

.breed-directory-loading {
    text-align: center;
    padding: 40px;
    color: var(--woof-color-neutral-500);
}

.breed-section {
    margin-bottom: 28px;
}

.breed-section-title {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.breed-section-count {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    font-weight: normal;
}

/* Popular breeds grid */
.breed-popular-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.breed-popular-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 12px;
    background: var(--woof-surface-primary);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
}

.breed-popular-card:hover {
    border-color: var(--woof-color-brand-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.breed-popular-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.breed-popular-name {
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    color: var(--woof-color-neutral-900);
}

.breed-popular-count {
    font-size: 12px;
    color: var(--woof-color-neutral-500);
}

/* Alphabetical breed list */
.breed-alpha-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.breed-alpha-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid var(--woof-color-neutral-100);
    transition: background-color 0.15s;
}

.breed-alpha-item:hover {
    background-color: var(--woof-color-neutral-100, rgba(0, 0, 0, 0.03));
}

.breed-alpha-icon {
    color: var(--woof-color-brand-primary);
    font-size: 14px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
}

.breed-alpha-info {
    flex: 1;
    min-width: 0;
}

.breed-alpha-name {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: var(--woof-color-neutral-900);
}

.breed-alpha-fi {
    display: block;
    font-size: 12px;
    color: var(--woof-color-neutral-500);
    margin-top: 1px;
}

.breed-alpha-arrow {
    font-size: 12px;
    color: var(--woof-color-neutral-300);
    flex-shrink: 0;
}

@media (min-width: 480px) {
    .breed-popular-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
