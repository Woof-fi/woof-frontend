<script>
    import { suggestDogPark } from '../../js/api.js';
    import { showToast } from '../../js/utils.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';

    let { territoryId = null, territoryName = '', onclose, onsuccess } = $props();

    let name = $state('');
    let nameFi = $state('');
    let parkType = $state('all_sizes');
    let address = $state('');
    let description = $state('');
    let latitude = $state('');
    let longitude = $state('');
    let submitting = $state(false);

    pushModalState('suggestPark', () => onclose?.());

    function close() {
        popModalState();
        onclose?.();
    }

    async function submit() {
        if (!name.trim()) return;
        submitting = true;
        try {
            const data = {
                name: name.trim(),
                nameFi: nameFi.trim() || undefined,
                parkType,
                address: address.trim() || undefined,
                description: description.trim() || undefined,
                territoryId: territoryId || undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
            };
            await suggestDogPark(data);
            showToast(t('dogPark.suggestSuccess'), 'success');
            onsuccess?.();
        } catch (e) {
            console.error('Failed to suggest park:', e);
            showToast(t('territory.actionFailed'), 'error');
        } finally {
            submitting = false;
        }
    }

    function handleOverlay(e) {
        if (e.target === e.currentTarget) close();
    }
</script>

<div
    class="modal"
    style:display="block"
    onclick={handleOverlay}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content suggest-park-modal">
        <div class="modal-header">
            <h2>{t('dogPark.suggestTitle')}</h2>
            <button class="modal-close" aria-label={t('common.close')} onclick={close}>&times;</button>
        </div>
        {#if territoryName}
            <p class="suggest-territory-hint">{territoryName}</p>
        {/if}
        <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
            <div class="form-group">
                <label for="park-name">{t('dogPark.name')} *</label>
                <input id="park-name" type="text" bind:value={name} required maxlength="255" placeholder="e.g. Herttoniemen koirapuisto" />
            </div>
            <div class="form-group">
                <label for="park-name-fi">{t('dogPark.nameFi')}</label>
                <input id="park-name-fi" type="text" bind:value={nameFi} maxlength="255" />
            </div>
            <div class="form-group">
                <label for="park-type">{t('dogPark.parkType')}</label>
                <select id="park-type" bind:value={parkType}>
                    <option value="all_sizes">{t('dogPark.allSizes')}</option>
                    <option value="small_dogs">{t('dogPark.smallDogs')}</option>
                    <option value="large_dogs">{t('dogPark.largeDogs')}</option>
                    <option value="separate_areas">{t('dogPark.separateAreas')}</option>
                </select>
            </div>
            <div class="form-group">
                <label for="park-address">{t('dogPark.address')}</label>
                <input id="park-address" type="text" bind:value={address} maxlength="500" />
            </div>
            <div class="form-group">
                <label for="park-desc">{t('dogPark.description')}</label>
                <textarea id="park-desc" bind:value={description} maxlength="2000" rows="3"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="park-lat">{t('dogPark.coordinates')} (lat)</label>
                    <input id="park-lat" type="number" step="any" bind:value={latitude} placeholder="60.1699" />
                </div>
                <div class="form-group">
                    <label for="park-lon">(lon)</label>
                    <input id="park-lon" type="number" step="any" bind:value={longitude} placeholder="24.9384" />
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick={close}>{t('common.cancel')}</button>
                <button type="submit" class="btn-primary" disabled={!name.trim() || submitting}>
                    {submitting ? t('common.loadingEllipsis') : t('territory.suggestPark')}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
.suggest-park-modal {
    max-width: 480px;
    width: 90vw;
}

.suggest-territory-hint {
    color: var(--woof-text-secondary);
    font-size: var(--woof-text-footnote);
    margin: 0 0 var(--woof-spacing-md);
    padding: 0 var(--woof-spacing-md);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--woof-spacing-sm);
}
</style>
