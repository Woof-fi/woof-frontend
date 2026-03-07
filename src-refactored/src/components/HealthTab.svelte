<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        isOwner = false,
        records = [],
        loading = false,
        loadedOnce = false,
        filterType = null,
        onFilterChange = null,
        onAddRecord = null,
        onEditRecord = null,
        onDeleteRecord = null,
    } = $props();

    const HEALTH_TYPE_CONFIG = {
        vet_visit:   { icon: 'fa-stethoscope', labelKey: 'health.vetVisit',    color: 'var(--woof-color-info)' },
        vaccination: { icon: 'fa-syringe',     labelKey: 'health.vaccination', color: 'var(--woof-color-success)' },
        medication:  { icon: 'fa-pills',       labelKey: 'health.medication',  color: 'var(--woof-color-warning)' },
        weight:      { icon: 'fa-weight-scale',      labelKey: 'health.weight',      color: 'var(--woof-color-brand-primary)' },
        note:        { icon: 'fa-note-sticky', labelKey: 'health.note',        color: 'var(--woof-color-neutral-500)' },
    };

    function formatHealthDate(date) {
        const parseable = typeof date === 'string' && date.length === 10
            ? date + 'T00:00:00' : date;
        return new Date(parseable).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
</script>

{#if !isOwner}
    <div class="private-content">
        <i class="fas fa-lock"></i>
        <p>{t('health.privateNotice')}</p>
    </div>
{:else}
    <div class="health-header">
        <h2>{t('profile.health')}</h2>
    </div>
    <div class="health-filters" id="health-filters">
        <button class="health-filter-btn" class:active={filterType === null} onclick={() => onFilterChange?.(null)}>{t('admin.all')}</button>
        <button class="health-filter-btn" class:active={filterType === 'vet_visit'} onclick={() => onFilterChange?.('vet_visit')}><i class="fas fa-stethoscope"></i> {t('health.vetVisit')}</button>
        <button class="health-filter-btn" class:active={filterType === 'vaccination'} onclick={() => onFilterChange?.('vaccination')}><i class="fas fa-syringe"></i> {t('health.vaccination')}</button>
        <button class="health-filter-btn" class:active={filterType === 'medication'} onclick={() => onFilterChange?.('medication')}><i class="fas fa-pills"></i> {t('health.medication')}</button>
        <button class="health-filter-btn" class:active={filterType === 'weight'} onclick={() => onFilterChange?.('weight')}><i class="fas fa-weight-scale"></i> {t('health.weight')}</button>
        <button class="health-filter-btn" class:active={filterType === 'note'} onclick={() => onFilterChange?.('note')}><i class="fas fa-note-sticky"></i> {t('health.note')}</button>
    </div>
    <button class="health-add-record-btn" onclick={onAddRecord}>
        <i class="fas fa-plus"></i> {t('health.addRecordBtn')}
    </button>
    <div class="health-timeline">
        {#if loading}
            <div class="health-loading"><i class="fas fa-spinner fa-spin"></i> {t('common.loading')}...</div>
        {:else if records.length === 0}
            {#if filterType}
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon">
                        <i class="fas fa-heart-pulse"></i>
                    </div>
                    <p>{t('health.noRecords')}</p>
                </div>
            {:else}
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon">
                        <i class="fas fa-heart-pulse"></i>
                    </div>
                    <p>{t('health.startTracking')}</p>
                    <button class="btn-primary" style="margin-top: var(--woof-space-1);" onclick={onAddRecord}>
                        <i class="fas fa-plus"></i> {t('health.addFirstRecord')}
                    </button>
                </div>
            {/if}
        {:else}
            {#each records as record (record.id)}
                {@const config = HEALTH_TYPE_CONFIG[record.type] || HEALTH_TYPE_CONFIG.note}
                <div class="health-card">
                    <div class="health-card-icon" style="background-color: {config.color}">
                        <i class="fas {config.icon}"></i>
                    </div>
                    <div class="health-card-body">
                        <div class="health-card-header">
                            <span class="health-card-type">{t(config.labelKey)}</span>
                            <span class="health-card-date">{formatHealthDate(record.date)}</span>
                        </div>
                        <p class="health-card-desc">{record.description}</p>
                        {#if record.notes}
                            <p class="health-card-notes">{record.notes}</p>
                        {/if}
                        {#if record.type === 'weight' && record.value != null}
                            <span class="health-value"><i class="fas fa-weight-scale"></i> {record.value} kg</span>
                        {/if}
                    </div>
                    <div class="health-card-actions">
                        <button class="health-action-btn health-edit-btn" title="Edit" onclick={() => onEditRecord?.(record)}>
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="health-action-btn health-delete-btn" title="Delete" onclick={() => onDeleteRecord?.(record)}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
{/if}

<style>
.health-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--woof-space-3);
}

.health-header h2 {
    margin: 0;
    font-size: var(--woof-text-title-3);
}

.health-add-record-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
    width: 100%;
    padding: var(--woof-space-3);
    margin-bottom: var(--woof-space-4);
    background: none;
    border: 1px dashed var(--woof-color-neutral-300);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    font-family: var(--woof-font-family);
    color: var(--woof-color-brand-primary);
    cursor: pointer;
    transition: all var(--woof-duration-fast);
}

.health-add-record-btn:hover {
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-subtle);
}

.health-add-record-btn i {
    font-size: var(--woof-text-caption-1);
}

.health-filters {
    display: flex;
    gap: var(--woof-space-2);
    overflow-x: auto;
    padding-bottom: var(--woof-space-3);
    margin-bottom: var(--woof-space-4);
    border-bottom: 1px solid var(--woof-color-neutral-200);
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.health-filters::-webkit-scrollbar {
    display: none;
}

.health-filter-btn {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    background: var(--woof-surface-primary);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
    font-family: var(--woof-font-family);
    color: var(--woof-color-neutral-500);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--woof-duration-fast);
}

.health-filter-btn i {
    font-size: var(--woof-text-caption-2);
}

.health-filter-btn:hover {
    border-color: var(--woof-color-neutral-400);
    background: var(--woof-color-neutral-50);
}

.health-filter-btn.active {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border-color: var(--woof-color-brand-primary);
}

.health-timeline {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
}

.health-loading {
    text-align: center;
    padding: var(--woof-space-8);
    color: var(--woof-color-neutral-500);
}

.health-card {
    display: flex;
    align-items: flex-start;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3);
    background: var(--woof-surface-primary);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    transition: box-shadow var(--woof-duration-fast);
}

.health-card:hover {
    box-shadow: var(--woof-shadow-sm);
}

.health-card-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-1);
}

.health-card-body {
    flex: 1;
    min-width: 0;
}

.health-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--woof-space-1);
}

.health-card-type {
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-900);
}

.health-card-date {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-500);
}

.health-card-desc {
    margin: 0 0 var(--woof-space-1);
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-900);
}

.health-card-notes {
    margin: 0;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    font-style: italic;
}

.health-value {
    display: inline-block;
    margin-top: 4px;
    padding: 2px 8px;
    background: var(--woof-color-brand-primary-subtle);
    border-radius: var(--woof-radius-full);
    font-size: 13px;
    font-weight: 600;
    color: var(--woof-color-brand-primary);
}

.health-card-actions {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--woof-duration-fast);
}

.health-card:hover .health-card-actions {
    opacity: 1;
}

.health-action-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--woof-radius-full);
    background: transparent;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--woof-text-caption-2);
    transition: all var(--woof-duration-fast);
}

.health-action-btn:hover {
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-900);
}

.health-delete-btn:hover {
    background: rgba(255, 59, 48, 0.1);
    color: var(--woof-color-error);
}

.private-content {
    text-align: center;
    padding: 40px 20px;
    color: var(--woof-color-neutral-500);
}

.private-content i {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
}

@media (max-width: 768px) {
    .health-card-actions {
        opacity: 1;
    }
}
</style>
