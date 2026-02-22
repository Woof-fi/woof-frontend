<script>
    import { getAllDogs } from '../../js/api.js';
    import { debounce } from '../../js/utils.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';

    let visible = $state(false);
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

    function open() {
        visible = true;
        pushModalState();
        toggleBodyScroll(true);
        setTimeout(() => inputEl?.focus(), 100);
    }

    function close() {
        if (!visible) return;
        visible = false;
        popModalState();
        toggleBodyScroll(false);
        query = '';
        results = [];
    }

    function handleKey(e) {
        if (e.key === 'Escape' && visible) close();
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
        function handleOpen() { open(); }
        function handleCloseAll() { if (visible) close(); }

        loadSearchData();
        window.addEventListener('openSearchPanel', handleOpen);
        window.addEventListener('close-all-modals', handleCloseAll);

        return () => {
            window.removeEventListener('openSearchPanel', handleOpen);
            window.removeEventListener('close-all-modals', handleCloseAll);
        };
    });
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="search-panel"
    class="search-panel"
    class:active={visible}
    aria-hidden={!visible}
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
