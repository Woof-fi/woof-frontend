/**
 * Health Record Modal
 * Add/edit health records for a dog
 */

import { createHealthRecord, updateHealthRecord } from './api.js';
import { showToast } from './utils.js';
import { toggleBodyScroll } from './ui.js';

let onSaveCallback = null;
let editingRecord = null;
let currentDogId = null;

/**
 * Initialize the health record modal
 */
export function initHealthRecordModal() {
    const modal = document.getElementById('health-record-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const form = document.getElementById('health-record-form');
    const typeSelect = document.getElementById('health-record-type');
    const valueGroup = document.getElementById('health-record-value-group');

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeHealthRecordModal);
    }

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeHealthRecordModal();
    });

    // Show/hide value field based on type
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            if (valueGroup) {
                valueGroup.style.display = typeSelect.value === 'weight' ? 'block' : 'none';
            }
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
 * Open the health record modal
 * @param {string} dogId - Dog ID
 * @param {object|null} record - Existing record to edit (null for new)
 * @param {Function} onSave - Callback after successful save
 */
export function openHealthRecordModal(dogId, record = null, onSave = null) {
    const modal = document.getElementById('health-record-modal');
    if (!modal) return;

    currentDogId = dogId;
    editingRecord = record;
    onSaveCallback = onSave;

    const title = modal.querySelector('.modal-header h2');
    const submitBtn = modal.querySelector('button[type="submit"]');
    const typeSelect = document.getElementById('health-record-type');
    const dateInput = document.getElementById('health-record-date');
    const descInput = document.getElementById('health-record-description');
    const notesInput = document.getElementById('health-record-notes');
    const valueInput = document.getElementById('health-record-value');
    const valueGroup = document.getElementById('health-record-value-group');

    if (record) {
        // Edit mode
        if (title) title.textContent = 'Edit Health Record';
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        if (typeSelect) typeSelect.value = record.type;
        if (dateInput) dateInput.value = record.date;
        if (descInput) descInput.value = record.description;
        if (notesInput) notesInput.value = record.notes || '';
        if (valueInput) valueInput.value = record.value || '';
        if (valueGroup) valueGroup.style.display = record.type === 'weight' ? 'block' : 'none';
    } else {
        // New record mode
        if (title) title.textContent = 'Add Health Record';
        if (submitBtn) submitBtn.textContent = 'Add Record';
        if (typeSelect) typeSelect.value = 'vet_visit';
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (descInput) descInput.value = '';
        if (notesInput) notesInput.value = '';
        if (valueInput) valueInput.value = '';
        if (valueGroup) valueGroup.style.display = 'none';
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
    const typeSelect = document.getElementById('health-record-type');
    const dateInput = document.getElementById('health-record-date');
    const descInput = document.getElementById('health-record-description');
    const notesInput = document.getElementById('health-record-notes');
    const valueInput = document.getElementById('health-record-value');
    const submitBtn = document.querySelector('#health-record-form button[type="submit"]');

    if (!currentDogId || !typeSelect || !dateInput || !descInput) return;

    const data = {
        type: typeSelect.value,
        date: dateInput.value,
        description: descInput.value.trim(),
    };

    if (notesInput && notesInput.value.trim()) {
        data.notes = notesInput.value.trim();
    }

    if (typeSelect.value === 'weight' && valueInput && valueInput.value) {
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

        closeHealthRecordModal();
        if (onSaveCallback) onSaveCallback();
    } catch (error) {
        console.error('Failed to save health record:', error);
        const msg = error.data?.details?.[0]?.message || error.message || 'Failed to save record';
        showToast(msg, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}
