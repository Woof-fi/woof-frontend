/**
 * Health Record Modal
 * Add/edit health records with type-specific forms
 */

import { createHealthRecord, updateHealthRecord } from './api.js';
import { showToast } from './utils.js';
import { toggleBodyScroll } from './ui.js';

let onSaveCallback = null;
let editingRecord = null;
let currentDogId = null;

// Type-specific configuration
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

/**
 * Initialize the health record modal
 */
export function initHealthRecordModal() {
    const modal = document.getElementById('health-record-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const form = document.getElementById('health-record-form');
    const typeTabs = document.getElementById('health-type-tabs');

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeHealthRecordModal);
    }

    // Cancel button
    const cancelBtn = modal.querySelector('.health-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeHealthRecordModal);
    }

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeHealthRecordModal();
    });

    // Type tabs
    if (typeTabs) {
        typeTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.health-type-tab');
            if (!tab) return;
            const type = tab.dataset.type;
            selectType(type);
        });
    }

    // Form submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmit();
        });
    }
}

/**
 * Select a record type and update form fields
 */
function selectType(type) {
    const typeInput = document.getElementById('health-record-type');
    const tabs = document.querySelectorAll('.health-type-tab');
    const descInput = document.getElementById('health-record-description');
    const descLabel = document.getElementById('health-desc-label');
    const notesInput = document.getElementById('health-record-notes');
    const valueGroup = document.getElementById('health-record-value-group');

    if (typeInput) typeInput.value = type;

    tabs.forEach(t => t.classList.toggle('active', t.dataset.type === type));

    const config = TYPE_CONFIG[type] || TYPE_CONFIG.note;

    if (descLabel) descLabel.textContent = config.descLabel;
    if (descInput) {
        descInput.placeholder = config.descPlaceholder;
        descInput.required = config.descRequired !== false;
    }
    if (notesInput) notesInput.placeholder = config.notesPlaceholder;
    if (valueGroup) valueGroup.style.display = config.showWeight ? '' : 'none';
}

/**
 * Open the health record modal
 * @param {string} dogId - Dog ID
 * @param {object|null} record - Existing record to edit (null for new)
 * @param {Function} onSave - Callback after successful save
 * @param {string|null} preselectedType - Pre-select this type tab
 */
export function openHealthRecordModal(dogId, record = null, onSave = null, preselectedType = null) {
    const modal = document.getElementById('health-record-modal');
    if (!modal) return;

    currentDogId = dogId;
    editingRecord = record;
    onSaveCallback = onSave;

    const title = document.getElementById('health-modal-title');
    const submitBtn = document.getElementById('health-submit-btn');
    const typeTabs = document.getElementById('health-type-tabs');
    const dateInput = document.getElementById('health-record-date');
    const descInput = document.getElementById('health-record-description');
    const notesInput = document.getElementById('health-record-notes');
    const valueInput = document.getElementById('health-record-value');

    if (record) {
        // Edit mode — hide type tabs (can't change type)
        if (title) title.textContent = 'Edit Health Record';
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        if (typeTabs) typeTabs.style.display = 'none';
        selectType(record.type);
        if (dateInput) dateInput.value = record.date;
        if (descInput) descInput.value = record.description;
        if (notesInput) notesInput.value = record.notes || '';
        if (valueInput) valueInput.value = record.value || '';
    } else {
        // New record mode
        if (title) title.textContent = 'Add Health Record';
        if (submitBtn) submitBtn.textContent = 'Add Record';
        if (typeTabs) typeTabs.style.display = '';
        const type = preselectedType || 'vet_visit';
        selectType(type);
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (descInput) descInput.value = '';
        if (notesInput) notesInput.value = '';
        if (valueInput) valueInput.value = '';
    }

    modal.style.display = 'flex';
    toggleBodyScroll(true);
}

/**
 * Close the health record modal
 */
export function closeHealthRecordModal() {
    const modal = document.getElementById('health-record-modal');
    if (!modal) return;

    modal.style.display = 'none';
    toggleBodyScroll(false);
    editingRecord = null;
    currentDogId = null;
    onSaveCallback = null;
}

/**
 * Handle form submission
 */
async function handleSubmit() {
    const typeInput = document.getElementById('health-record-type');
    const dateInput = document.getElementById('health-record-date');
    const descInput = document.getElementById('health-record-description');
    const notesInput = document.getElementById('health-record-notes');
    const valueInput = document.getElementById('health-record-value');
    const submitBtn = document.getElementById('health-submit-btn');

    if (!currentDogId || !typeInput || !dateInput) return;

    const type = typeInput.value;
    const data = {
        type,
        date: dateInput.value,
        description: descInput?.value.trim() || '',
    };

    // For weight type, description is optional — use a default if empty
    if (type === 'weight' && !data.description) {
        data.description = 'Weight check';
    }

    if (notesInput && notesInput.value.trim()) {
        data.notes = notesInput.value.trim();
    }

    if (type === 'weight' && valueInput && valueInput.value) {
        data.value = parseFloat(valueInput.value);
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
        if (editingRecord) {
            await updateHealthRecord(currentDogId, editingRecord.id, data);
            showToast('Health record updated', 'success');
        } else {
            await createHealthRecord(currentDogId, data);
            showToast('Health record added', 'success');
        }

        const callback = onSaveCallback;
        closeHealthRecordModal();
        if (callback) callback();
    } catch (error) {
        console.error('Failed to save health record:', error);
        const msg = error.data?.details?.[0]?.message || error.message || 'Failed to save record';
        showToast(msg, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}
