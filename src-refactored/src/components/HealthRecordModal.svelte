<script>
    import { createHealthRecord, updateHealthRecord } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/toast-store.svelte.js';
    import { modals, closeHealthRecordModal as storeClose } from '../../js/modal-store.svelte.js';
    import { bumpHealthVersion } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let submitting = $state(false);
    let isEditMode = $state(false);
    let currentDogId = $state(null);
    let editingRecord = $state(null);

    // Form fields
    let currentType = $state('vet_visit');
    let date = $state('');
    let description = $state('');
    let notes = $state('');
    let weightValue = $state('');

    let TYPE_CONFIG = $derived({
        vet_visit: {
            descLabel: t('health.vetVisitDesc'),
            descPlaceholder: t('health.vetVisitPlaceholder'),
            notesPlaceholder: t('health.vetVisitNotes'),
            showWeight: false,
        },
        vaccination: {
            descLabel: t('health.vaccinationDesc'),
            descPlaceholder: t('health.vaccinationPlaceholder'),
            notesPlaceholder: t('health.vaccinationNotes'),
            showWeight: false,
        },
        medication: {
            descLabel: t('health.medicationDesc'),
            descPlaceholder: t('health.medicationPlaceholder'),
            notesPlaceholder: t('health.medicationNotes'),
            showWeight: false,
        },
        weight: {
            descLabel: t('health.weightDesc'),
            descPlaceholder: t('health.weightPlaceholder'),
            notesPlaceholder: t('health.weightNotes'),
            showWeight: true,
            descRequired: false,
        },
        note: {
            descLabel: t('health.noteDesc'),
            descPlaceholder: t('health.notePlaceholder'),
            notesPlaceholder: t('health.noteNotes'),
            showWeight: false,
        },
    });

    let typeConfig = $derived(TYPE_CONFIG[currentType] || TYPE_CONFIG.note);

    // Populate form fields when modal opens with health record data
    $effect(() => {
        if (modals.healthRecordModalOpen && modals.healthRecordData) {
            currentDogId = modals.healthRecordData.dogId;
            const record = modals.healthRecordData.record;
            editingRecord = record;
            isEditMode = !!record;

            if (record) {
                currentType = record.type;
                date = record.date;
                description = record.description;
                notes = record.notes || '';
                weightValue = record.value || '';
            } else {
                currentType = modals.healthRecordData.defaultType || 'vet_visit';
                date = new Date().toISOString().split('T')[0];
                description = '';
                notes = '';
                weightValue = '';
            }
        }
    });

    // Manage body scroll + modal history based on store state
    $effect(() => {
        if (modals.healthRecordModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.healthRecordModalOpen) return;
        storeClose();
        editingRecord = null;
        currentDogId = null;
    }

    function handleKey(e) {
        if (e.key === 'Escape') close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!currentDogId) return;

        const data = {
            type: currentType,
            date,
            description: description.trim() || (currentType === 'weight' ? 'Weight check' : ''),
        };

        if (notes.trim()) data.notes = notes.trim();
        if (currentType === 'weight' && weightValue) {
            data.value = parseFloat(weightValue);
        }

        submitting = true;
        try {
            if (editingRecord) {
                await updateHealthRecord(currentDogId, editingRecord.id, data);
                showToast(t('health.recordUpdated'), 'success');
            } else {
                await createHealthRecord(currentDogId, data);
                const dogSlug = modals.healthRecordData?.dogSlug;
                showToast(t('health.recordAdded'), 'success',
                    dogSlug ? { label: t('common.view'), href: `/dog/${dogSlug}#health` } : null
                );
            }
            close();
            bumpHealthVersion();
        } catch (err) {
            console.error('Failed to save health record:', err);
            const msg = err.data?.details?.[0]?.message || err.message || 'Failed to save record';
            showToast(msg, 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="health-record-modal"
    class="modal"
    style:display={modals.healthRecordModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content health-modal-content">
        <div class="modal-header">
            <h2 id="health-modal-title">{isEditMode ? t('health.editRecord') : t('health.addRecord')}</h2>
            <button class="modal-close" aria-label={t('common.close')} onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            {#if !isEditMode}
                <div class="health-type-tabs" id="health-type-tabs">
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'vet_visit'}
                        data-type="vet_visit"
                        onclick={() => currentType = 'vet_visit'}
                    ><i class="fas fa-stethoscope"></i> {t('health.vetVisit')}</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'vaccination'}
                        data-type="vaccination"
                        onclick={() => currentType = 'vaccination'}
                    ><i class="fas fa-syringe"></i> {t('health.vaccination')}</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'medication'}
                        data-type="medication"
                        onclick={() => currentType = 'medication'}
                    ><i class="fas fa-pills"></i> {t('health.medication')}</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'weight'}
                        data-type="weight"
                        onclick={() => currentType = 'weight'}
                    ><i class="fas fa-weight"></i> {t('health.weight')}</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'note'}
                        data-type="note"
                        onclick={() => currentType = 'note'}
                    ><i class="fas fa-sticky-note"></i> {t('health.note')}</button>
                </div>
            {/if}

            <form id="health-record-form" onsubmit={handleSubmit}>
                <input type="hidden" id="health-record-type" value={currentType} />
                <div class="health-form-fields">
                    <div class="form-row">
                        <div class="form-group form-group-flex">
                            <label for="health-record-date">{t('health.date')}</label>
                            <input
                                type="date"
                                id="health-record-date"
                                required
                                bind:value={date}
                            />
                        </div>
                        {#if typeConfig.showWeight}
                            <div class="form-group form-group-flex" id="health-record-value-group">
                                <label for="health-record-value">Weight (kg) *</label>
                                <input
                                    type="number"
                                    id="health-record-value"
                                    min="0.1"
                                    max="200"
                                    step="0.1"
                                    placeholder="e.g., 25.5"
                                    bind:value={weightValue}
                                />
                            </div>
                        {/if}
                    </div>
                    <div class="form-group">
                        <label for="health-record-description" id="health-desc-label">
                            {typeConfig.descLabel}
                        </label>
                        <input
                            type="text"
                            id="health-record-description"
                            required={typeConfig.descRequired !== false}
                            maxlength="1000"
                            placeholder={typeConfig.descPlaceholder}
                            bind:value={description}
                        />
                    </div>
                    <div class="form-group">
                        <label for="health-record-notes">{t('health.notes')}</label>
                        <textarea
                            id="health-record-notes"
                            rows="3"
                            maxlength="2000"
                            placeholder={typeConfig.notesPlaceholder}
                            bind:value={notes}
                        ></textarea>
                    </div>
                </div>
                <div class="health-modal-actions">
                    <button type="button" class="btn-secondary health-cancel-btn" onclick={close}>{t('common.cancel')}</button>
                    <button type="submit" class="btn-primary" id="health-submit-btn" disabled={submitting}>
                        {submitting ? t('postEdit.saving') : isEditMode ? t('common.save') : t('health.addRecordBtn')}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
.health-modal-content {
    max-width: 600px;
    width: 90%;
    margin: 8% auto;
    box-sizing: border-box;
}

.health-type-tabs {
    display: flex;
    gap: var(--woof-space-2);
    flex-wrap: wrap;
    margin-bottom: var(--woof-space-5);
}

.health-type-tab {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--woof-radius-full);
    background: var(--color-surface);
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-medium);
    color: var(--color-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--woof-duration-fast);
}

.health-type-tab:hover {
    border-color: var(--color-text-secondary);
    background: var(--color-bg-alt);
}

.health-type-tab.active {
    background: var(--color-primary);
    color: var(--woof-color-neutral-0);
    border-color: var(--color-primary);
}

.health-type-tab i {
    font-size: var(--woof-text-caption-1);
}

.health-form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
}

.form-row {
    display: flex;
    gap: var(--woof-space-3);
}

.form-group-flex {
    flex: 1;
}

.health-modal-actions {
    display: flex;
    gap: var(--woof-space-3);
    margin-top: var(--woof-space-5);
    padding-top: var(--woof-space-4);
    border-top: 1px solid var(--woof-color-neutral-200);
}

.health-modal-actions .btn-secondary {
    padding: var(--woof-space-3) var(--woof-space-5);
    font-size: var(--woof-text-body);
    border-radius: var(--woof-btn-radius);
    white-space: nowrap;
}

.health-modal-actions .btn-primary {
    flex: 1;
    padding: var(--woof-space-3) var(--woof-space-5);
    font-size: var(--woof-text-body);
    border-radius: var(--woof-btn-radius);
}

@media (max-width: 480px) {
    .health-modal-content {
        width: 95%;
        margin: 2vh auto;
        padding: var(--woof-space-4);
    }

    .health-type-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        gap: var(--woof-space-2);
        padding-bottom: var(--woof-space-1);
    }

    .health-type-tabs::-webkit-scrollbar {
        display: none;
    }

    .health-type-tab {
        flex-shrink: 0;
        padding: var(--woof-space-2) var(--woof-space-3);
        font-size: var(--woof-text-caption-1);
    }

    .form-row {
        flex-direction: column;
        gap: var(--woof-space-3);
    }
}
</style>
