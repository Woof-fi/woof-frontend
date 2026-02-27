<script>
    import { searchBreeds } from '../../js/api.js';

    let {
        selectedBreedId = $bindable(''),
        selectedBreedName = $bindable(''),
        id = 'breed-autocomplete',
        required = false,
    } = $props();

    let query = $state('');
    let results = $state([]);
    let isOpen = $state(false);
    let highlightIndex = $state(-1);
    let inputEl = $state(null);
    let debounceTimer = $state(null);
    let loading = $state(false);

    // When selectedBreedName changes externally (e.g., edit modal populating), update the input
    $effect(() => {
        if (selectedBreedName && !isOpen) {
            query = selectedBreedName;
        }
    });

    function handleInput() {
        const value = query.trim();

        // If user clears the input, clear selection
        if (!value) {
            clearSelection();
            results = [];
            isOpen = false;
            return;
        }

        // Debounce search
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (value.length < 1) return;
            loading = true;
            try {
                results = await searchBreeds(value);
                isOpen = results.length > 0;
                highlightIndex = -1;
            } finally {
                loading = false;
            }
        }, 300);
    }

    function selectBreed(breed) {
        selectedBreedId = breed.id;
        selectedBreedName = breed.name;
        query = breed.name;
        isOpen = false;
        results = [];
        highlightIndex = -1;
    }

    function clearSelection() {
        selectedBreedId = '';
        selectedBreedName = '';
    }

    function handleKeydown(e) {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightIndex = Math.min(highlightIndex + 1, results.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightIndex = Math.max(highlightIndex - 1, 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < results.length) {
                selectBreed(results[highlightIndex]);
            }
        } else if (e.key === 'Escape') {
            isOpen = false;
            highlightIndex = -1;
        }
    }

    function handleBlur() {
        // Small delay so click on dropdown item registers before closing
        setTimeout(() => {
            isOpen = false;
            // If user typed but didn't select, revert to selected name or clear
            if (query.trim() !== selectedBreedName) {
                if (selectedBreedName) {
                    query = selectedBreedName;
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

<div class="breed-autocomplete">
    <input
        type="text"
        {id}
        {required}
        autocomplete="off"
        maxlength="100"
        placeholder="e.g., Finnish Lapphund"
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
    <!-- Hidden input for form validation -->
    <input type="hidden" name="breed_id" value={selectedBreedId} />

    {#if isOpen && results.length > 0}
        <ul class="breed-dropdown" id="{id}-listbox" role="listbox">
            {#each results as breed, i}
                <li
                    class="breed-option"
                    class:highlighted={i === highlightIndex}
                    role="option"
                    aria-selected={i === highlightIndex}
                    onmousedown={() => selectBreed(breed)}
                    onmouseenter={() => { highlightIndex = i; }}
                >
                    <i class="fas fa-paw breed-option-icon"></i>
                    <span class="breed-option-name">{breed.name}</span>
                </li>
            {/each}
        </ul>
    {/if}

    {#if loading}
        <div class="breed-loading">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    {/if}
</div>

<style>
    .breed-autocomplete {
        position: relative;
    }

    .breed-autocomplete input[type="text"] {
        width: 100%;
        box-sizing: border-box;
    }

    .breed-dropdown {
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

    .breed-option {
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
        padding: var(--woof-space-2) var(--woof-space-3);
        cursor: pointer;
        transition: background var(--woof-duration-instant) ease;
    }

    .breed-option:hover,
    .breed-option.highlighted {
        background: var(--woof-color-neutral-100);
    }

    .breed-option-icon {
        color: var(--woof-color-brand-primary);
        font-size: var(--woof-text-caption-1);
        flex-shrink: 0;
    }

    .breed-option-name {
        font-size: var(--woof-text-callout);
        font-weight: var(--woof-font-weight-medium);
        color: var(--woof-color-neutral-900);
    }

    .breed-loading {
        position: absolute;
        top: 50%;
        right: var(--woof-space-3);
        transform: translateY(-50%);
        color: var(--woof-color-neutral-400);
        font-size: var(--woof-text-caption-1);
    }
</style>
