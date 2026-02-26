<script>
    import { createHealthRecord, updateHealthRecord } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';
    import { modals, closeHealthRecordModal as storeClose } from '../../js/modal-store.svelte.js';
    import { bumpHealthVersion } from '../../js/svelte-store.svelte.js';

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

    const TYPE_CONFIG = {
        vet_visit: {
            descLabel: 'Reason for visit *',
            descPlaceholder: 'e.g., Annual check-up, Ear infection',
            notesPlaceholder: 'Vet name, diagnosis, treatment details...',
            showWeight: false,
        },
        vaccination: {
            descLabel: 'Vaccine name *',
            descPlaceholder: 'e.g., Rabies, DHPP, Bordetella',
            notesPlaceholder: 'Batch number, next booster due date...',
            showWeight: false,
        },
        medication: {
            descLabel: 'Medication name *',
            descPlaceholder: 'e.g., Apoquel, Heartgard, Bravecto',
            notesPlaceholder: 'Dosage, frequency, duration...',
            showWeight: false,
        },
        weight: {
            descLabel: 'Description (optional)',
            descPlaceholder: 'e.g., Post-diet weigh-in',
            notesPlaceholder: 'Additional notes...',
            showWeight: true,
            descRequired: false,
        },
        note: {
            descLabel: 'Title *',
            descPlaceholder: 'e.g., Allergy noted, Behavioral change',
            notesPlaceholder: 'Details...',
            showWeight: false,
        },
    };

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
                currentType = 'vet_visit';
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
                showToast('Health record updated', 'success');
            } else {
                await createHealthRecord(currentDogId, data);
                showToast('Health record added', 'success');
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
            <h2 id="health-modal-title">{isEditMode ? 'Edit Health Record' : 'Add Health Record'}</h2>
            <button class="modal-close" aria-label="Close" onclick={close}>&times;</button>
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
                    ><i class="fas fa-stethoscope"></i> Vet Visit</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'vaccination'}
                        data-type="vaccination"
                        onclick={() => currentType = 'vaccination'}
                    ><i class="fas fa-syringe"></i> Vaccination</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'medication'}
                        data-type="medication"
                        onclick={() => currentType = 'medication'}
                    ><i class="fas fa-pills"></i> Medication</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'weight'}
                        data-type="weight"
                        onclick={() => currentType = 'weight'}
                    ><i class="fas fa-weight"></i> Weight</button>
                    <button
                        type="button"
                        class="health-type-tab"
                        class:active={currentType === 'note'}
                        data-type="note"
                        onclick={() => currentType = 'note'}
                    ><i class="fas fa-sticky-note"></i> Note</button>
                </div>
            {/if}

            <form id="health-record-form" onsubmit={handleSubmit}>
                <input type="hidden" id="health-record-type" value={currentType} />
                <div class="health-form-fields">
                    <div class="form-row">
                        <div class="form-group form-group-flex">
                            <label for="health-record-date">Date *</label>
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
                        <label for="health-record-notes">Notes (optional)</label>
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
                    <button type="button" class="btn-secondary health-cancel-btn" onclick={close}>Cancel</button>
                    <button type="submit" class="btn-primary" id="health-submit-btn" disabled={submitting}>
                        {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Record'}
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
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.health-type-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: var(--color-surface);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

.health-type-tab:hover {
    border-color: var(--color-text-secondary);
    background: var(--color-bg-alt);
}

.health-type-tab.active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
}

.health-type-tab i {
    font-size: 12px;
}

.health-form-fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-row {
    display: flex;
    gap: 12px;
}

.form-group-flex {
    flex: 1;
}

.health-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
}

.health-modal-actions .btn-secondary,
.health-modal-actions .btn-primary {
    padding: 10px 20px;
    font-size: 14px;
}

@media (max-width: 480px) {
    .health-modal-content {
        width: 95%;
        margin: 2vh auto;
        padding: 16px;
    }

    .health-type-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        gap: 6px;
        padding-bottom: 4px;
    }

    .health-type-tabs::-webkit-scrollbar {
        display: none;
    }

    .health-type-tab {
        flex-shrink: 0;
        padding: 6px 10px;
        font-size: 12px;
    }

    .form-row {
        flex-direction: column;
        gap: 14px;
    }
}
</style>
