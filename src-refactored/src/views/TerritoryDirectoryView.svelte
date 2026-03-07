<script>
    import { getTerritoryDirectory, getFollowingTerritories, searchTerritories } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';

    let countries = $state([]);
    let popular = $state([]);
    let allMunicipalities = $state([]);
    let followedTerritories = $state([]);
    let loading = $state(true);
    let query = $state('');
    let searchResults = $state([]);
    let searching = $state(false);
    let debounceTimer = $state(null);

    let isSearching = $derived(query.length > 0);

    let authed = $derived(store.authUser !== null);

    // Load directory data + followed territories
    $effect(() => {
        let active = true;
        (async () => {
            try {
                const promises = [getTerritoryDirectory()];
                if (isAuthenticated()) {
                    promises.push(getFollowingTerritories());
                }
                const results = await Promise.all(promises);
                if (!active) return;

                const dirData = results[0];
                countries = dirData.countries || [];
                popular = dirData.popular || [];

                allMunicipalities = countries
                    .flatMap(c => c.municipalities || [])
                    .sort((a, b) => localName(a).localeCompare(localName(b)));

                if (results[1]) {
                    followedTerritories = results[1];
                }
            } catch (e) {
                console.error('Failed to load territory directory:', e);
            } finally {
                if (active) loading = false;
            }
        })();
        return () => { active = false; };
    });

    // Re-fetch followed territories when follow/unfollow happens
    $effect(() => {
        const _tv = store.territoryVersion;
        if (!isAuthenticated()) {
            followedTerritories = [];
            return;
        }
        let active = true;
        (async () => {
            try {
                const territories = await getFollowingTerritories();
                if (active) followedTerritories = territories;
            } catch { /* ignore */ }
        })();
        return () => { active = false; };
    });

    function handleSearchInput() {
        const value = query.trim();
        if (!value) {
            searchResults = [];
            searching = false;
            return;
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        searching = true;
        debounceTimer = setTimeout(async () => {
            try {
                searchResults = await searchTerritories(value);
            } catch {
                searchResults = [];
            } finally {
                searching = false;
            }
        }, 250);
    }

    function formatContext(territory) {
        if (territory.parentName && territory.grandparentName) {
            return `${territory.parentName}, ${territory.grandparentName}`;
        }
        if (territory.parentName) {
            return territory.parentName;
        }
        return '';
    }

    function dogCountLabel(count) {
        return count === 1
            ? t('territoryDirectory.dogSingular', { count })
            : t('territoryDirectory.dogCount', { count });
    }
</script>

<div class="territory-directory">
    <div class="territory-directory-header">
        <h1>{t('territoryDirectory.title')}</h1>
        <p class="territory-directory-subtitle">{t('territoryDirectory.subtitle')}</p>
    </div>

    <div class="territory-directory-search">
        <i class="fas fa-magnifying-glass"></i>
        <input
            type="text"
            placeholder={t('territoryDirectory.searchPlaceholder')}
            bind:value={query}
            oninput={handleSearchInput}
        />
    </div>

    {#if loading}
        <div class="territory-directory-loading"><i class="fas fa-spinner fa-spin"></i> {t('territoryDirectory.loading')}</div>
    {:else if isSearching}
        <section class="territory-section">
            <h2 class="territory-section-title">
                {t('territoryDirectory.resultsFor', { query })}
                {#if !searching}
                    <span class="territory-section-count">{searchResults.length}</span>
                {/if}
            </h2>
            {#if searching}
                <div class="territory-directory-loading"><i class="fas fa-spinner fa-spin"></i></div>
            {:else if searchResults.length === 0}
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon">
                        <i class="fas fa-magnifying-glass"></i>
                    </div>
                    <p>{t('territoryDirectory.noResults', { query })}</p>
                </div>
            {:else}
                <ul class="territory-alpha-list">
                    {#each searchResults as ter (ter.id)}
                        {@const context = formatContext(ter)}
                        <li>
                            <a href="/territory/{ter.urlPath}" data-link class="territory-alpha-item">
                                <i class="fas fa-location-dot territory-alpha-icon"></i>
                                <div class="territory-alpha-info">
                                    <span class="territory-alpha-name">{ter.name}</span>
                                    {#if context}
                                        <span class="territory-alpha-context">{context}</span>
                                    {/if}
                                </div>
                                <i class="fas fa-chevron-right territory-alpha-arrow"></i>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {:else}
        {#if authed && followedTerritories.length > 0}
            <section class="territory-section">
                <h2 class="territory-section-title">{t('territoryDirectory.yourTerritories')}</h2>
                <div class="territory-popular-grid">
                    {#each followedTerritories as ter (ter.id)}
                        <a href="/territory/{ter.urlPath || ter.slug}" data-link class="territory-popular-card">
                            <div class="territory-popular-icon">
                                <i class="fas fa-location-dot"></i>
                            </div>
                            <span class="territory-popular-name">{localName(ter)}</span>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}

        {#if popular.length > 0}
            <section class="territory-section">
                <h2 class="territory-section-title">{t('territoryDirectory.popularTerritories')}</h2>
                <div class="territory-popular-grid">
                    {#each popular as ter (ter.id)}
                        <a href="/territory/{ter.urlPath}" data-link class="territory-popular-card">
                            <div class="territory-popular-icon">
                                <i class="fas fa-location-dot"></i>
                            </div>
                            <span class="territory-popular-name">{localName(ter)}</span>
                            <span class="territory-popular-count">{dogCountLabel(ter.dogCount)}</span>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}

        <section class="territory-section">
            <h2 class="territory-section-title">
                {t('territoryDirectory.allTerritories')}
                <span class="territory-section-count">{allMunicipalities.length}</span>
            </h2>
            <ul class="territory-alpha-list">
                {#each allMunicipalities as ter (ter.id)}
                    <li>
                        <a href="/territory/{ter.urlPath}" data-link class="territory-alpha-item">
                            <i class="fas fa-location-dot territory-alpha-icon"></i>
                            <div class="territory-alpha-info">
                                <span class="territory-alpha-name">{localName(ter)}</span>
                            </div>
                            <i class="fas fa-chevron-right territory-alpha-arrow"></i>
                        </a>
                    </li>
                {/each}
            </ul>
        </section>
    {/if}
</div>

<style>
.territory-directory {
    max-width: 640px;
    margin: 0 auto;
    padding: 0 0 40px;
}

.territory-directory-header {
    margin-bottom: 20px;
}

.territory-directory-header h1 {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    margin: 0 0 4px;
    color: var(--woof-color-neutral-900);
}

.territory-directory-subtitle {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.territory-directory-search {
    position: relative;
    margin-bottom: 24px;
}

.territory-directory-search i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--woof-color-neutral-400);
    font-size: 14px;
}

.territory-directory-search input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--woof-radius-lg);
    font-size: var(--woof-text-body);
    background: var(--color-surface);
    color: var(--color-text);
    box-sizing: border-box;
}

.territory-directory-search input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--woof-color-brand-primary-subtle);
}

.territory-directory-loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
}

.territory-section {
    margin-bottom: 28px;
}

.territory-section-title {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.territory-section-count {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    font-weight: normal;
}

/* Popular/followed territories grid */
.territory-popular-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.territory-popular-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--woof-radius-lg);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
}

.territory-popular-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.territory-popular-icon {
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

.territory-popular-name {
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    color: var(--color-text);
}

.territory-popular-count {
    font-size: 12px;
    color: var(--color-text-secondary);
}

/* Alphabetical territory list */
.territory-alpha-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.territory-alpha-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid var(--woof-color-neutral-100);
    transition: background-color 0.15s;
}

.territory-alpha-item:hover {
    background-color: var(--color-hover, rgba(0, 0, 0, 0.03));
}

.territory-alpha-icon {
    color: var(--woof-color-brand-primary);
    font-size: 14px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
}

.territory-alpha-info {
    flex: 1;
    min-width: 0;
}

.territory-alpha-name {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
}

.territory-alpha-context {
    display: block;
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 1px;
}

.territory-alpha-arrow {
    font-size: 12px;
    color: var(--woof-color-neutral-300);
    flex-shrink: 0;
}

@media (min-width: 480px) {
    .territory-popular-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
