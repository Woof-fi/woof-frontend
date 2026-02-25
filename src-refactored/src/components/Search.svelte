<script>
    import { getAllDogs } from '../../js/api.js';
    import { debounce } from '../../js/utils.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { modals, closeSearchPanel as storeClose } from '../../js/modal-store.svelte.js';

    let query = $state('');
    let searchCache = $state([]);
    let results = $state([]);
    let inputEl = $state(null);

    async function loadSearchData() {
        try {
            const dogs = await getAllDogs();
            searchCache = dogs.map(dog => ({
                id: dog.id,
                slug: dog.slug,
                name: dog.name,
                breed: dog.breed,
                profilePhoto: dog.profilePhoto,
            }));
        } catch {
            searchCache = [];
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
        results = [];
    }

    function handleKey(e) {
        if (e.key === 'Escape' && modals.searchPanelOpen) close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    function handleResultClick() {
        close();
    }

    const debouncedSearch = debounce((q) => {
        if (!q.trim()) {
            results = [];
            return;
        }
        const lower = q.toLowerCase();
        results = searchCache.filter(item =>
            item.name.toLowerCase().includes(lower) ||
            (item.breed || '').toLowerCase().includes(lower)
        );
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
>
    <div class="search-bar">
        <div class="search-input-wrapper">
            <i class="fas fa-search search-input-icon"></i>
            <input
                type="text"
                id="mobile-search-input"
                placeholder="Search"
                autocomplete="off"
                bind:this={inputEl}
                bind:value={query}
            />
        </div>
        <button class="close-search" aria-label="Close search" onclick={close}>Cancel</button>
    </div>
    <ul id="search-results" class="search-results" role="listbox">
        {#if query.trim() && results.length === 0}
            <li class="search-no-results">
                <span>No results found for "{query}"</span>
            </li>
        {:else}
            {#each results as result (result.id)}
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
    </ul>
</div>
