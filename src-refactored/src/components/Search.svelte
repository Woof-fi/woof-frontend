<script>
    import { getAllDogs, getAllBreeds, getAllTerritories } from '../../js/api.js';
    import { debounce } from '../../js/utils.js';
    import { pushModalState, popModalState, resetModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { modals, closeSearchPanel as storeClose } from '../../js/modal-store.svelte.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';

    let query = $state('');
    let dogCache = $state([]);
    let breedCache = $state([]);
    let territoryCache = $state([]);
    let dogResults = $state([]);
    let breedResults = $state([]);
    let territoryResults = $state([]);
    let inputEl = $state(null);

    /** Build a /territory/... URL from the getAllTerritories response shape */
    function buildTerritoryUrl(ter) {
        if (ter.urlPath) return `/territory/${ter.urlPath}`;
        return `/territory/${ter.slug}`;
    }

    /** Human-readable type label for territory search results */
    function territorySubtitle(ter) {
        const typeName = ter.type === 'sub_district' ? 'Sub-district'
            : ter.type === 'district' ? 'District'
            : 'Municipality';
        if (ter.parentName) return `${typeName} · ${localName({ name: ter.parentName, nameFi: ter.parentNameFi || ter.parentName })}`;
        return typeName;
    }

    async function loadSearchData() {
        try {
            const [dogs, breeds, territories] = await Promise.all([
                getAllDogs(), getAllBreeds(), getAllTerritories()
            ]);
            dogCache = dogs.map(dog => ({
                id: dog.id,
                slug: dog.slug,
                name: dog.name,
                breed: dog.breedName,
                breedFi: dog.breedNameFi,
                profilePhoto: dog.profilePhoto,
            }));
            breedCache = breeds.map(b => ({
                id: b.id,
                slug: b.slug,
                name: b.name,
                nameFi: b.nameFi,
            }));
            territoryCache = territories.map(ter => ({
                id: ter.id,
                slug: ter.slug,
                name: ter.name,
                nameFi: ter.nameFi,
                type: ter.type,
                urlPath: ter.urlPath,
                parentName: ter.parentName,
                parentNameFi: ter.parentNameFi,
                url: buildTerritoryUrl(ter),
            }));
        } catch {
            dogCache = [];
            breedCache = [];
            territoryCache = [];
        }
    }

    // Manage body scroll + modal history based on store state
    $effect(() => {
        if (modals.searchPanelOpen) {
            pushModalState();
            toggleBodyScroll(true);
            setTimeout(() => inputEl?.focus(), 100);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.searchPanelOpen) return;
        storeClose();
        query = '';
        dogResults = [];
        breedResults = [];
        territoryResults = [];
    }

    function handleKey(e) {
        if (e.key === 'Escape' && modals.searchPanelOpen) close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    function handleResultClick() {
        // Reset modal state without history.back() — the data-link handler
        // will pushState to the new URL, replacing the modal history entry.
        resetModalState();
        storeClose();
        query = '';
        dogResults = [];
        breedResults = [];
        territoryResults = [];
    }

    let hasQuery = $derived(query.trim().length >= 2);
    let noResults = $derived(hasQuery && dogResults.length === 0 && breedResults.length === 0 && territoryResults.length === 0);

    /**
     * Filter + rank results: starts-with matches first, then contains.
     * `getFields` returns an array of lowercase searchable strings for each item.
     */
    function rankedSearch(items, getFields, lower, limit) {
        const matches = items.filter(item =>
            getFields(item).some(f => f.includes(lower))
        );
        // Stable sort: starts-with first
        matches.sort((a, b) => {
            const aStarts = getFields(a).some(f => f.startsWith(lower)) ? 0 : 1;
            const bStarts = getFields(b).some(f => f.startsWith(lower)) ? 0 : 1;
            return aStarts - bStarts;
        });
        return limit ? matches.slice(0, limit) : matches;
    }

    const debouncedSearch = debounce((q) => {
        if (q.trim().length < 2) {
            dogResults = [];
            breedResults = [];
            territoryResults = [];
            return;
        }
        const lower = q.toLowerCase();
        dogResults = rankedSearch(dogCache, item => [
            item.name.toLowerCase(),
            (item.breed || '').toLowerCase(),
            (item.breedFi || '').toLowerCase()
        ], lower);
        breedResults = rankedSearch(breedCache, item => [
            item.name.toLowerCase(),
            (item.nameFi || '').toLowerCase()
        ], lower, 5);
        territoryResults = rankedSearch(territoryCache, item => [
            item.name.toLowerCase(),
            (item.nameFi || '').toLowerCase()
        ], lower, 5);
    }, 300);

    $effect(() => {
        debouncedSearch(query);
    });

    $effect(() => {
        loadSearchData();
    });
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="search-panel"
    class="search-panel"
    class:active={modals.searchPanelOpen}
    inert={!modals.searchPanelOpen || undefined}
    onclick={handleOverlayClick}
    role="presentation"
>
    <div class="search-bar">
        <div class="search-input-wrapper">
            <i class="fas fa-magnifying-glass search-input-icon"></i>
            <input
                type="text"
                id="mobile-search-input"
                placeholder={t('search.placeholder')}
                autocomplete="off"
                bind:this={inputEl}
                bind:value={query}
            />
        </div>
        <button class="close-search" aria-label="Close search" onclick={close}>{t('search.cancel')}</button>
    </div>
    <ul id="search-results" class="search-results" role="listbox">
        {#if noResults}
            <li class="search-no-results">
                <span>{t('search.noResults', { query })}</span>
            </li>
        {:else}
            {#if dogResults.length > 0}
                {#if territoryResults.length > 0 || breedResults.length > 0}
                    <li class="search-section-header">{t('search.dogs')}</li>
                {/if}
                {#each dogResults as result (result.id)}
                    <li class="search-result-item" onclick={handleResultClick} onkeydown={handleResultClick} role="option" aria-selected="false">
                        <a
                            href="/dog/{result.slug || result.id}"
                            data-link
                            class="search-result-link"
                        >
                            <img
                                src={result.profilePhoto || '/images/dog_profile_pic.jpg'}
                                alt={result.name}
                                class="search-result-avatar"
                                loading="lazy"
                                onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                            />
                            <div class="search-result-text">
                                <span class="search-result-name">{result.name}</span>
                                <span class="search-result-breed">{result.breed}</span>
                            </div>
                        </a>
                    </li>
                {/each}
            {/if}
            {#if territoryResults.length > 0}
                <li class="search-section-header">{t('search.territories')}</li>
                {#each territoryResults as ter (ter.id)}
                    <li class="search-result-item" onclick={handleResultClick} onkeydown={handleResultClick} role="option" aria-selected="false">
                        <a href={ter.url} data-link class="search-result-link">
                            <div class="search-result-icon search-result-icon--territory">
                                <i class="fas fa-location-dot"></i>
                            </div>
                            <div class="search-result-text">
                                <span class="search-result-name">{localName(ter)}</span>
                                <span class="search-result-breed">{territorySubtitle(ter)}</span>
                            </div>
                        </a>
                    </li>
                {/each}
            {/if}
            {#if breedResults.length > 0}
                <li class="search-section-header">{t('search.breeds')}</li>
                {#each breedResults as breed (breed.id)}
                    <li class="search-result-item" onclick={handleResultClick} onkeydown={handleResultClick} role="option" aria-selected="false">
                        <a href="/breed/{breed.slug}" data-link class="search-result-link">
                            <div class="search-result-icon">
                                <i class="fas fa-paw"></i>
                            </div>
                            <div class="search-result-text">
                                <span class="search-result-name">{localName(breed)}</span>
                            </div>
                        </a>
                    </li>
                {/each}
            {/if}
        {/if}
    </ul>
</div>

<style>
.search-panel {
    position: fixed;
    top: var(--woof-header-height);
    left: 280px;
    width: 400px;
    height: calc(100vh - var(--woof-header-height));
    background-color: var(--woof-surface-primary);
    border-right: 1px solid var(--woof-color-neutral-200);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    visibility: hidden;
    opacity: 0;
    transition: transform 0.3s ease-in-out, visibility 0.3s, opacity 0.3s;
    z-index: 900;
}

.search-panel.active {
    transform: translateX(0);
    visibility: visible;
    opacity: 1;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--woof-color-neutral-200);
    flex-shrink: 0;
}

.search-input-wrapper {
    position: relative;
    flex: 1;
}

.search-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--woof-color-neutral-400);
    font-size: 14px;
    pointer-events: none;
}

.search-input-wrapper input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border: none;
    border-radius: var(--woof-radius-md);
    background-color: var(--woof-color-neutral-50);
    font-size: 16px;
    color: var(--woof-color-neutral-900);
    box-sizing: border-box;
    outline: none;
}

.search-input-wrapper input::placeholder {
    color: var(--woof-color-neutral-400);
}

.search-input-wrapper input:focus {
    background-color: var(--woof-color-neutral-50);
}

.close-search {
    background: none;
    border: none;
    color: var(--woof-color-neutral-900);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px;
    white-space: nowrap;
}

.close-search:hover {
    color: var(--woof-color-neutral-400);
}

#search-results {
    list-style: none;
    padding: 8px 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
}

.search-result-item {
    margin-bottom: 4px;
}

.search-result-link {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: var(--woof-radius-sm);
    text-decoration: none;
    color: var(--woof-color-neutral-900);
    transition: background-color 0.15s;
}

.search-result-link:hover {
    background-color: var(--woof-color-neutral-100);
}

.search-result-avatar {
    width: 44px;
    height: 44px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    margin-right: 12px;
    flex-shrink: 0;
}

.search-result-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.search-result-name {
    font-weight: 600;
    font-size: 14px;
    line-height: 1.3;
}

.search-result-breed {
    font-size: 13px;
    color: var(--woof-color-neutral-400);
    line-height: 1.3;
}

.search-no-results {
    padding: 20px 12px;
    text-align: center;
    color: var(--woof-color-neutral-400);
    font-size: 14px;
    list-style: none;
}

.search-section-header {
    padding: 12px 16px 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--woof-color-neutral-400);
    list-style: none;
}

.search-result-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    margin-right: 12px;
    flex-shrink: 0;
}

.search-result-icon--territory {
    background: var(--woof-color-brand-secondary-subtle);
    color: var(--woof-color-brand-secondary);
}

@media (max-width: 768px) {
    .search-panel {
        position: fixed;
        left: 0;
        width: 100%;
        top: 0;
        height: 100vh;
        z-index: 1001;
        background-color: var(--woof-surface-primary);
        display: flex;
        flex-direction: column;
        padding: 0;
        visibility: hidden;
        opacity: 0;
        transition: visibility 0s, opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        transform: translateY(-20px);
    }

    .search-panel.active {
        visibility: visible;
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
