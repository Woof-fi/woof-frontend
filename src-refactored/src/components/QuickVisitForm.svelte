<script>
    import { getMyDogs, getFollowingDogParks, searchDogParks, scheduleParkVisit } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { openCreateDogModal } from '../../js/modal-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import { localName, t } from '../../js/i18n-store.svelte.js';

    let { onback = null, onclose = null, oncloseinstant = null } = $props();

    let dogs = $state([]);
    let followedParks = $state([]);
    let loading = $state(true);
    let submitting = $state(false);

    let selectedDogIds = $state(new Set());
    /** @type {{ id: string, name: string, nameFi?: string, city?: string } | null} */
    let selectedPark = $state(null);
    let duration = $state(60);
    let note = $state('');

    // Search state
    let searchQuery = $state('');
    let searchResults = $state([]);
    let searching = $state(false);
    let searchTimer = null;
    let showResults = $state(false);

    let hasManyDogs = $derived(dogs.length > 1);
    let singleDogName = $derived(dogs.length === 1 ? dogs[0].name : '');
    let selectedCount = $derived(selectedDogIds.size);

    function toggleDog(dogId) {
        const next = new Set(selectedDogIds);
        if (next.has(dogId)) {
            next.delete(dogId);
        } else {
            next.add(dogId);
        }
        selectedDogIds = next;
    }

    // Default arrival: next full hour (matching DogParkView pattern)
    function getDefaultTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    }

    let visitTime = $state(getDefaultTime());

    // Fetch dogs + followed parks on mount
    $effect(() => {
        if (!isAuthenticated()) {
            loading = false;
            return;
        }

        let active = true;
        (async () => {
            try {
                const [fetchedDogs, fetchedParks] = await Promise.all([
                    getMyDogs(),
                    getFollowingDogParks(),
                ]);
                if (!active) return;

                if (fetchedDogs.length === 0) {
                    if (oncloseinstant) {
                        oncloseinstant(() => {
                            showToast(t('postCreate.addDogFirst'), 'error');
                            openCreateDogModal();
                        });
                    } else {
                        onclose?.();
                        showToast(t('postCreate.addDogFirst'), 'error');
                        openCreateDogModal();
                    }
                    return;
                }

                dogs = fetchedDogs;
                followedParks = fetchedParks;
                selectedDogIds = dogs.length === 1 ? new Set([dogs[0].id]) : new Set();
            } catch {
                if (!active) return;
                showToast(t('common.failedLoad'), 'error');
            }
            loading = false;
        })();
        return () => { active = false; };
    });

    function selectPark(park) {
        selectedPark = park;
        searchQuery = '';
        searchResults = [];
        showResults = false;
    }

    function clearPark() {
        selectedPark = null;
    }

    function handleSearchInput(e) {
        const q = e.target.value;
        searchQuery = q;

        if (searchTimer) clearTimeout(searchTimer);

        if (q.trim().length < 2) {
            searchResults = [];
            searching = false;
            showResults = false;
            return;
        }

        searching = true;
        showResults = true;
        searchTimer = setTimeout(async () => {
            const results = await searchDogParks(q.trim());
            // Filter out already-followed parks (they're shown as chips)
            const followedIds = new Set(followedParks.map(p => p.id));
            searchResults = results.filter(r => !followedIds.has(r.id));
            searching = false;
        }, 300);
    }

    function handleSearchFocus() {
        if (searchQuery.trim().length >= 2) {
            showResults = true;
        }
    }

    function handleSearchBlur() {
        // Delay to allow click on results
        setTimeout(() => { showResults = false; }, 200);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const ids = dogs.length === 1 ? [dogs[0].id] : [...selectedDogIds];
        if (ids.length === 0 || !selectedPark || !visitTime) return;

        submitting = true;
        try {
            const arrivalDate = new Date(visitTime);
            await Promise.all(ids.map(dogId =>
                scheduleParkVisit(selectedPark.id, {
                    dogId,
                    arrivalAt: arrivalDate.toISOString(),
                    durationMinutes: duration,
                    note: note.trim() || undefined,
                })
            ));
            showToast(
                t('dogPark.visitScheduled') || 'Visit scheduled!',
                'success',
                selectedPark.slug ? { label: t('common.view'), href: `/dog-park/${selectedPark.slug}` } : null
            );
            onclose?.();
        } catch (err) {
            console.error('Failed to schedule visit:', err);
            showToast(t('common.failedLoad'), 'error');
        }
        submitting = false;
    }

    function handleExploreParks() {
        onclose?.();
    }
</script>

<div class="quick-form">
    <div class="quick-form-header">
        <button class="back-btn" aria-label={t('common.back')} onclick={() => onback?.()}>
            <i class="fas fa-arrow-left"></i>
        </button>
        <h3 class="quick-form-title">{t('visit.title')}</h3>
    </div>

    {#if loading}
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    {:else}
        <form onsubmit={handleSubmit}>
            <div class="form-group">
                <label class="form-label" for="visit-dog">{t('visit.dog')}</label>
                {#if hasManyDogs}
                    <div class="visit-dog-list" id="visit-dog">
                        {#each dogs as dog (dog.id)}
                            <button
                                type="button"
                                class="visit-dog-option"
                                class:visit-dog-option--selected={selectedDogIds.has(dog.id)}
                                onclick={() => toggleDog(dog.id)}
                            >
                                <span class="visit-checkbox" class:visit-checkbox--checked={selectedDogIds.has(dog.id)}>
                                    {#if selectedDogIds.has(dog.id)}
                                        <i class="fas fa-check"></i>
                                    {/if}
                                </span>
                                <span>{dog.name}</span>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <div class="single-dog-display" id="visit-dog">
                        <i class="fas fa-dog single-dog-icon"></i>
                        <span>{singleDogName}</span>
                    </div>
                {/if}
            </div>

            <div class="form-group">
                <span class="form-label">{t('visit.park')}</span>

                {#if selectedPark}
                    <!-- Selected park display -->
                    <div class="selected-park">
                        <div class="selected-park-info">
                            <span class="selected-park-name">{localName(selectedPark)}</span>
                            {#if selectedPark.city}
                                <span class="selected-park-city">{selectedPark.city}</span>
                            {/if}
                        </div>
                        <button type="button" class="clear-park-btn" aria-label={t('visit.clearPark')} onclick={clearPark}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                {:else}
                    <!-- Followed park chips -->
                    {#if followedParks.length > 0}
                        <div class="park-chips">
                            {#each followedParks as park (park.id)}
                                <button type="button" class="park-chip" onclick={() => selectPark(park)}>
                                    {localName(park)}
                                </button>
                            {/each}
                        </div>
                    {/if}

                    <!-- Search input -->
                    <div class="search-wrapper">
                        <i class="fas fa-magnifying-glass search-icon"></i>
                        <input
                            type="text"
                            class="search-input"
                            placeholder={followedParks.length > 0 ? t('visit.searchAllParks') : t('visit.searchParks')}
                            value={searchQuery}
                            oninput={handleSearchInput}
                            onfocus={handleSearchFocus}
                            onblur={handleSearchBlur}
                        />
                        {#if searching}
                            <i class="fas fa-spinner fa-spin search-spinner"></i>
                        {/if}
                    </div>

                    <!-- Search results dropdown -->
                    {#if showResults && (searchResults.length > 0 || (searchQuery.trim().length >= 2 && !searching))}
                        <div class="search-results">
                            {#if searchResults.length > 0}
                                {#each searchResults as park (park.id)}
                                    <button type="button" class="search-result-item" onclick={() => selectPark(park)}>
                                        <span class="result-name">{localName(park)}</span>
                                        {#if park.territory || park.territoryFi}
                                            <span class="result-city">{localName({ name: park.territory, nameFi: park.territoryFi })}</span>
                                        {:else if park.city}
                                            <span class="result-city">{park.city}</span>
                                        {/if}
                                    </button>
                                {/each}
                            {:else if !searching}
                                <div class="no-results">{t('visit.noParksFound')}</div>
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>

            <div class="form-row">
                <div class="form-group form-group-half">
                    <label class="form-label" for="visit-time">{t('visit.time')}</label>
                    <input
                        id="visit-time"
                        type="datetime-local"
                        class="form-input"
                        bind:value={visitTime}
                    />
                </div>

                <div class="form-group form-group-half">
                    <label class="form-label" for="visit-duration">{t('visit.duration')}</label>
                    <select id="visit-duration" class="form-select" bind:value={duration}>
                        <option value={15}>{t('visit.dur15')}</option>
                        <option value={30}>{t('visit.dur30')}</option>
                        <option value={60}>{t('visit.dur1h')}</option>
                        <option value={90}>{t('visit.dur1h30')}</option>
                        <option value={120}>{t('visit.dur2h')}</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label" for="visit-note">{t('visit.noteLabel')}</label>
                <input
                    id="visit-note"
                    type="text"
                    class="form-input"
                    placeholder={t('visit.notePlaceholder')}
                    maxlength="500"
                    bind:value={note}
                />
            </div>

            <button type="submit" class="submit-btn" disabled={submitting || selectedDogIds.size === 0 || !selectedPark || !visitTime}>
                {#key submitting}
                    {#if submitting}
                        <i class="fas fa-spinner fa-spin"></i>
                    {:else}
                        <i class="fas fa-calendar-check"></i>
                    {/if}
                {/key}
                {t('visit.submit')}
            </button>
        </form>
    {/if}
</div>

<style>
.quick-form {
    padding: var(--woof-space-4) var(--woof-space-5) var(--woof-space-5);
}

.quick-form-header {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-5);
}

.back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--woof-color-neutral-500);
    font-size: var(--woof-text-body);
    padding: var(--woof-space-1);
    border-radius: var(--woof-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    flex-shrink: 0;
    transition: background var(--woof-duration-fast);
}

.back-btn:hover {
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-900);
}

.quick-form-title {
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: var(--woof-space-8) 0;
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-title-3);
}

/* ---- Single dog display ---- */

.single-dog-display {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-3);
    background: var(--woof-color-neutral-50);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-700);
}

.single-dog-icon {
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
}

/* ---- Multi-dog selection ---- */

.visit-dog-list {
    display: flex;
    gap: var(--woof-space-2);
    flex-wrap: wrap;
}

.visit-dog-option {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 2px solid var(--woof-color-neutral-200);
    background: none;
    border-radius: var(--woof-radius-md);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-900);
    transition: all var(--woof-duration-fast);
}

.visit-dog-option:hover {
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-subtle);
}

.visit-dog-option--selected {
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-subtle);
}

.visit-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 2px solid var(--woof-color-neutral-300);
    border-radius: var(--woof-radius-sm);
    font-size: 11px;
    color: var(--woof-color-neutral-0);
    transition: all var(--woof-duration-fast);
    flex-shrink: 0;
}

.visit-checkbox--checked {
    background: var(--woof-color-brand-primary);
    border-color: var(--woof-color-brand-primary);
}

/* ---- Park selection ---- */

.park-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-2);
}

.park-chip {
    padding: var(--woof-space-2) var(--woof-space-3);
    background: var(--woof-color-neutral-50);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-footnote);
    font-family: var(--woof-font-family);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-700);
    cursor: pointer;
    transition: background var(--woof-duration-fast), border-color var(--woof-duration-fast);
    white-space: nowrap;
}

.park-chip:hover {
    background: var(--woof-color-brand-primary-subtle);
    border-color: var(--woof-color-brand-primary);
    color: var(--woof-color-brand-primary);
}

.selected-park {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3);
    background: var(--woof-color-brand-primary-subtle);
    border: 1px solid var(--woof-color-brand-primary);
    border-radius: var(--woof-radius-md);
}

.selected-park-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.selected-park-name {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.selected-park-city {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
}

.clear-park-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-body);
    padding: var(--woof-space-1);
    border-radius: var(--woof-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--woof-avatar-xs);
    height: var(--woof-avatar-xs);
    flex-shrink: 0;
    transition: color var(--woof-duration-fast), background var(--woof-duration-fast);
}

.clear-park-btn:hover {
    color: var(--woof-color-neutral-700);
    background: var(--woof-color-neutral-100);
}

/* ---- Search ---- */

.search-wrapper {
    position: relative;
}

.search-icon {
    position: absolute;
    left: var(--woof-space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-3);
    padding-left: calc(var(--woof-space-3) + 16px + var(--woof-space-2));
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: var(--woof-font-family);
    color: var(--woof-color-neutral-900);
    background: var(--woof-color-neutral-0);
    transition: border-color var(--woof-duration-fast);
    box-sizing: border-box;
}

.search-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    box-shadow: 0 0 0 3px var(--woof-color-brand-primary-subtle);
}

.search-input::placeholder {
    color: var(--woof-color-neutral-400);
}

.search-spinner {
    position: absolute;
    right: var(--woof-space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
}

.search-results {
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    background: var(--woof-color-neutral-0);
    margin-top: var(--woof-space-1);
    max-height: 160px;
    overflow-y: auto;
    box-shadow: var(--woof-shadow-md);
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    width: 100%;
    padding: var(--woof-space-3);
    background: none;
    border: none;
    border-bottom: 1px solid var(--woof-color-neutral-100);
    cursor: pointer;
    text-align: left;
    font-family: var(--woof-font-family);
    transition: background var(--woof-duration-fast);
}

.search-result-item:last-child {
    border-bottom: none;
}

.search-result-item:hover {
    background: var(--woof-color-neutral-50);
}

.result-name {
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-900);
}

.result-city {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin-left: auto;
    flex-shrink: 0;
}

.no-results {
    padding: var(--woof-space-3);
    text-align: center;
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
}

/* ---- Form elements ---- */

.form-group {
    margin-bottom: var(--woof-space-4);
}

.form-row {
    display: flex;
    gap: var(--woof-space-3);
}

.form-group-half {
    flex: 1;
}

.form-label {
    display: block;
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-500);
    margin-bottom: var(--woof-space-1);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.form-select,
.form-input {
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: var(--woof-font-family);
    color: var(--woof-color-neutral-900);
    background: var(--woof-color-neutral-0);
    transition: border-color var(--woof-duration-fast);
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
}

.form-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--woof-space-3) center;
    padding-right: var(--woof-space-8);
}

.form-select:focus,
.form-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    box-shadow: 0 0 0 3px var(--woof-color-brand-primary-subtle);
}

.form-input::placeholder {
    color: var(--woof-color-neutral-400);
}

.submit-btn {
    width: 100%;
    padding: var(--woof-space-3) var(--woof-space-5);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
    border-radius: var(--woof-btn-radius);
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    font-family: var(--woof-font-family);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
    height: var(--woof-btn-height-lg);
    transition: background var(--woof-duration-fast), transform var(--woof-duration-fast);
    margin-top: var(--woof-space-2);
}

.submit-btn:hover:not(:disabled) {
    background: var(--woof-color-brand-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--woof-shadow-brand);
}

.submit-btn:active:not(:disabled) {
    transform: translateY(0);
}

.submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
