<script>
    import { searchTerritories, browseTerritoryChildren } from '../../js/api.js';

    let {
        selectedTerritoryId = $bindable(''),
        selectedTerritoryName = $bindable(''),
        id = 'territory-autocomplete',
        required = false,
    } = $props();

    let query = $state('');
    let results = $state([]);
    let isOpen = $state(false);
    let highlightIndex = $state(-1);
    let inputEl = $state(null);
    let debounceTimer = $state(null);
    let loading = $state(false);

    // Drill-down state
    let mode = $state('search'); // 'search' | 'browse'
    let breadcrumb = $state([]); // [{id, name}, ...] for back navigation

    // When selectedTerritoryName changes externally (e.g., edit modal), update input
    $effect(() => {
        if (selectedTerritoryName && !isOpen) {
            query = selectedTerritoryName;
        }
    });

    function handleInput() {
        const value = query.trim();

        // If user types, always go back to search mode
        if (mode === 'browse') {
            mode = 'search';
            breadcrumb = [];
        }

        if (!value) {
            clearSelection();
            results = [];
            isOpen = false;
            return;
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (value.length < 1) return;
            loading = true;
            try {
                results = await searchTerritories(value);
                isOpen = results.length > 0;
                highlightIndex = -1;
            } finally {
                loading = false;
            }
        }, 300);
    }

    function selectTerritory(territory) {
        selectedTerritoryId = territory.id;
        selectedTerritoryName = formatDisplayName(territory);
        query = selectedTerritoryName;
        isOpen = false;
        results = [];
        highlightIndex = -1;
        mode = 'search';
        breadcrumb = [];
    }

    async function drillDown(territory) {
        loading = true;
        try {
            breadcrumb = [...breadcrumb, { id: territory.id, name: territory.name }];
            results = await browseTerritoryChildren(territory.id);
            mode = 'browse';
            highlightIndex = -1;
            isOpen = true;
        } finally {
            loading = false;
        }
    }

    async function goBack() {
        if (breadcrumb.length <= 1) {
            // Go back to search mode
            mode = 'search';
            breadcrumb = [];
            if (query.trim()) {
                loading = true;
                try {
                    results = await searchTerritories(query.trim());
                    highlightIndex = -1;
                } finally {
                    loading = false;
                }
            } else {
                results = [];
            }
        } else {
            // Pop breadcrumb and browse parent's children
            const newBreadcrumb = breadcrumb.slice(0, -1);
            const parentId = newBreadcrumb[newBreadcrumb.length - 1].id;
            loading = true;
            try {
                results = await browseTerritoryChildren(parentId);
                breadcrumb = newBreadcrumb;
                highlightIndex = -1;
            } finally {
                loading = false;
            }
        }
    }

    function handleItemClick(territory) {
        if (territory.hasChildren) {
            drillDown(territory);
        } else {
            selectTerritory(territory);
        }
    }

    function formatDisplayName(territory) {
        if (territory.type === 'sub_district' && territory.parentName && territory.grandparentName) {
            return `${territory.name}, ${territory.parentName}, ${territory.grandparentName}`;
        }
        if (territory.type === 'district' && territory.parentName) {
            return `${territory.name}, ${territory.parentName}`;
        }
        return territory.name;
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

    function formatBreadcrumbLabel() {
        if (breadcrumb.length === 0) return '';
        return breadcrumb.map(b => b.name).join(', ');
    }

    function clearSelection() {
        selectedTerritoryId = '';
        selectedTerritoryName = '';
    }

    function handleKeydown(e) {
        if (!isOpen) return;

        const offset = mode === 'browse' ? 1 : 0; // Account for back button
        const totalItems = results.length + offset;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightIndex = Math.min(highlightIndex + 1, totalItems - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightIndex = Math.max(highlightIndex - 1, mode === 'browse' ? -1 : 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (mode === 'browse' && highlightIndex === -1) {
                // Back button highlighted in browse mode
                goBack();
            } else {
                const idx = mode === 'browse' ? highlightIndex : highlightIndex;
                if (idx >= 0 && idx < results.length) {
                    handleItemClick(results[idx]);
                }
            }
        } else if (e.key === 'Escape') {
            isOpen = false;
            highlightIndex = -1;
        }
    }

    function handleBlur() {
        setTimeout(() => {
            isOpen = false;
            if (query.trim() !== selectedTerritoryName) {
                if (selectedTerritoryName) {
                    query = selectedTerritoryName;
                } else {
                    query = '';
                }
            }
        }, 200);
    }

    function handleFocus() {
        if (query.trim() && results.length > 0) {
            isOpen = true;
        }
    }
</script>

<div class="territory-autocomplete">
    <input
        type="text"
        {id}
        {required}
        autocomplete="off"
        maxlength="100"
        placeholder="e.g., Kallio, Helsinki"
        bind:value={query}
        bind:this={inputEl}
        oninput={handleInput}
        onkeydown={handleKeydown}
        onblur={handleBlur}
        onfocus={handleFocus}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="{id}-listbox"
    />
    <input type="hidden" name="territory_id" value={selectedTerritoryId} />

    {#if isOpen && (results.length > 0 || mode === 'browse')}
        <ul class="territory-dropdown" id="{id}-listbox" role="listbox">
            {#if mode === 'browse'}
                <li
                    class="territory-back"
                    class:highlighted={highlightIndex === -1}
                    role="option"
                    aria-selected={highlightIndex === -1}
                    onmousedown={goBack}
                    onmouseenter={() => { highlightIndex = -1; }}
                >
                    <i class="fas fa-arrow-left territory-back-icon"></i>
                    <span class="territory-back-label">{formatBreadcrumbLabel()}</span>
                </li>
            {/if}
            {#each results as territory, i}
                <li
                    class="territory-option"
                    class:highlighted={i === highlightIndex}
                    role="option"
                    aria-selected={i === highlightIndex}
                    onmousedown={() => handleItemClick(territory)}
                    onmouseenter={() => { highlightIndex = i; }}
                >
                    {#if territory.hasChildren}
                        <i class="fas fa-map-marker-alt territory-option-icon"></i>
                    {:else}
                        <i class="fas fa-map-pin territory-option-icon"></i>
                    {/if}
                    <div class="territory-option-text">
                        <span class="territory-option-name">{territory.name}</span>
                        {#if mode === 'search'}
                            {@const context = formatContext(territory)}
                            {#if context}
                                <span class="territory-option-context">{context}</span>
                            {/if}
                        {/if}
                    </div>
                    {#if territory.hasChildren}
                        <i class="fas fa-chevron-right territory-drill-icon"></i>
                    {/if}
                </li>
            {/each}
            {#if results.length === 0 && mode === 'browse'}
                <li class="territory-empty">No sub-areas found</li>
            {/if}
        </ul>
    {/if}

    {#if loading}
        <div class="territory-loading">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    {/if}
</div>

<style>
    .territory-autocomplete {
        position: relative;
    }

    .territory-autocomplete input[type="text"] {
        width: 100%;
        box-sizing: border-box;
    }

    .territory-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 100;
        max-height: 300px;
        overflow-y: auto;
        background: var(--woof-surface-primary);
        border: 1px solid var(--woof-color-neutral-200);
        border-radius: var(--woof-radius-md);
        box-shadow: var(--woof-shadow-md);
        margin-top: var(--woof-space-1);
        padding: var(--woof-space-1) 0;
        list-style: none;
    }

    .territory-back {
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
        padding: var(--woof-space-2) var(--woof-space-3);
        cursor: pointer;
        border-bottom: 1px solid var(--woof-color-neutral-200);
        margin-bottom: var(--woof-space-1);
        transition: background var(--woof-duration-instant) ease;
    }

    .territory-back:hover,
    .territory-back.highlighted {
        background: var(--woof-color-neutral-100);
    }

    .territory-back-icon {
        color: var(--woof-color-neutral-500);
        font-size: var(--woof-text-caption-1);
    }

    .territory-back-label {
        font-size: var(--woof-text-caption-1);
        font-weight: var(--woof-font-weight-medium);
        color: var(--woof-color-neutral-600);
    }

    .territory-option {
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
        padding: var(--woof-space-2) var(--woof-space-3);
        cursor: pointer;
        transition: background var(--woof-duration-instant) ease;
    }

    .territory-option:hover,
    .territory-option.highlighted {
        background: var(--woof-color-neutral-100);
    }

    .territory-option-icon {
        color: var(--woof-color-brand-primary);
        font-size: var(--woof-text-caption-1);
        flex-shrink: 0;
        width: 16px;
        text-align: center;
    }

    .territory-option-text {
        flex: 1;
        min-width: 0;
    }

    .territory-option-name {
        font-size: var(--woof-text-callout);
        font-weight: var(--woof-font-weight-medium);
        color: var(--woof-color-neutral-900);
    }

    .territory-option-context {
        font-size: var(--woof-text-caption-1);
        color: var(--woof-color-neutral-500);
        margin-left: var(--woof-space-1);
    }

    .territory-drill-icon {
        color: var(--woof-color-neutral-400);
        font-size: var(--woof-text-caption-2);
        flex-shrink: 0;
    }

    .territory-empty {
        padding: var(--woof-space-2) var(--woof-space-3);
        color: var(--woof-color-neutral-400);
        font-size: var(--woof-text-caption-1);
        font-style: italic;
    }

    .territory-loading {
        position: absolute;
        top: 50%;
        right: var(--woof-space-3);
        transform: translateY(-50%);
        color: var(--woof-color-neutral-400);
        font-size: var(--woof-text-caption-1);
    }
</style>
