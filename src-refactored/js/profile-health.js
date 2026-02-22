/**
 * Profile Health
 * Health records tab: timeline display, CRUD actions, type filtering.
 */

import { getHealthRecords, deleteHealthRecord } from './api.js';
import { escapeHTML, showToast } from './utils.js';

/**
 * Open health record modal via window event (dispatched to HealthRecordModal.svelte)
 */
function openHealthRecordModal(dogId, record = null, onSave = null) {
    window.dispatchEvent(new CustomEvent('openHealthRecordModal', {
        detail: { dogId, record }
    }));
    if (onSave) {
        window.addEventListener('health-refresh', onSave, { once: true });
    }
}

// Health record type display config
const HEALTH_TYPE_CONFIG = {
    vet_visit:   { icon: 'fa-stethoscope', label: 'Vet Visit',    color: '#3b82f6' },
    vaccination: { icon: 'fa-syringe',     label: 'Vaccination',  color: '#10b981' },
    medication:  { icon: 'fa-pills',       label: 'Medication',   color: '#f59e0b' },
    weight:      { icon: 'fa-weight',      label: 'Weight',       color: '#EF4621' },
    note:        { icon: 'fa-sticky-note', label: 'Note',         color: '#6b7280' },
};

// Current filter state
let healthFilterType = null;

/**
 * Load health records tab (owner only — renders lock message otherwise)
 * @param {object} dog - Dog data object (needs .id and .isOwner)
 */
export async function loadHealthRecords(dog) {
    const healthContainer = document.querySelector('#health');
    if (!healthContainer) return;

    if (!dog.isOwner) {
        healthContainer.innerHTML = `
            <div class="private-content">
                <i class="fas fa-lock"></i>
                <p>Health records are private and only visible to the owner.</p>
            </div>
        `;
        return;
    }

    const dogId = dog.id;
    healthContainer.innerHTML = `
        <div class="health-header">
            <h2>Health Records</h2>
            <button class="btn-primary health-add-btn" id="add-health-record-btn">
                <i class="fas fa-plus"></i> Add Record
            </button>
        </div>
        <div class="health-filters" id="health-filters">
            <button class="health-filter-btn active" data-type="">All</button>
            <button class="health-filter-btn" data-type="vet_visit"><i class="fas fa-stethoscope"></i> Vet</button>
            <button class="health-filter-btn" data-type="vaccination"><i class="fas fa-syringe"></i> Vaccines</button>
            <button class="health-filter-btn" data-type="medication"><i class="fas fa-pills"></i> Meds</button>
            <button class="health-filter-btn" data-type="weight"><i class="fas fa-weight"></i> Weight</button>
            <button class="health-filter-btn" data-type="note"><i class="fas fa-sticky-note"></i> Notes</button>
        </div>
        <div class="health-timeline" id="health-timeline">
            <div class="health-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        </div>
    `;

    // Wire up add button
    const addBtn = document.getElementById('add-health-record-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openHealthRecordModal(dogId, null, () => _loadHealthTimeline(dogId), healthFilterType);
        });
    }

    // Wire up filter buttons
    const filterBtns = healthContainer.querySelectorAll('.health-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            healthFilterType = btn.dataset.type || null;
            _loadHealthTimeline(dogId);
        });
    });

    await _loadHealthTimeline(dogId);
}

/**
 * @private Load and render health timeline records
 */
async function _loadHealthTimeline(dogId) {
    const timeline = document.getElementById('health-timeline');
    if (!timeline) return;

    timeline.innerHTML = '<div class="health-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const opts = { limit: 50 };
        if (healthFilterType) opts.type = healthFilterType;
        const data = await getHealthRecords(dogId, opts);

        if (!data.records || data.records.length === 0) {
            if (healthFilterType) {
                timeline.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heartbeat"></i>
                        <p>No records of this type yet.</p>
                    </div>
                `;
            } else {
                timeline.innerHTML = '';
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.innerHTML = '<i class="fas fa-heartbeat"></i>';

                const msg = document.createElement('p');
                msg.textContent = "Start tracking your dog's health!";
                empty.appendChild(msg);

                const addBtn = document.createElement('button');
                addBtn.className = 'btn-primary';
                addBtn.style.marginTop = '12px';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Add First Record';
                addBtn.addEventListener('click', () => {
                    openHealthRecordModal(dogId, null, () => _loadHealthTimeline(dogId));
                });
                empty.appendChild(addBtn);
                timeline.appendChild(empty);
            }
            return;
        }

        timeline.innerHTML = '';
        data.records.forEach(record => {
            const config = HEALTH_TYPE_CONFIG[record.type] || HEALTH_TYPE_CONFIG.note;
            const dateParseable = typeof record.date === 'string' && record.date.length === 10
                ? record.date + 'T00:00:00'
                : record.date;
            const recordDate = new Date(dateParseable);
            const dateStr = recordDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const card = document.createElement('div');
            card.className = 'health-card';

            let valueHtml = '';
            if (record.type === 'weight' && record.value != null) {
                valueHtml = `<span class="health-value"><i class="fas fa-weight"></i> ${record.value} kg</span>`;
            }

            card.innerHTML = `
                <div class="health-card-icon" style="background-color: ${config.color}">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="health-card-body">
                    <div class="health-card-header">
                        <span class="health-card-type">${config.label}</span>
                        <span class="health-card-date">${dateStr}</span>
                    </div>
                    <p class="health-card-desc">${escapeHTML(record.description)}</p>
                    ${record.notes ? `<p class="health-card-notes">${escapeHTML(record.notes)}</p>` : ''}
                    ${valueHtml}
                </div>
                <div class="health-card-actions">
                    <button class="health-action-btn health-edit-btn" title="Edit" data-id="${record.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="health-action-btn health-delete-btn" title="Delete" data-id="${record.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            card.querySelector('.health-edit-btn').addEventListener('click', () => {
                openHealthRecordModal(dogId, record, () => _loadHealthTimeline(dogId));
            });

            card.querySelector('.health-delete-btn').addEventListener('click', async () => {
                if (!confirm('Delete this health record?')) return;
                try {
                    await deleteHealthRecord(dogId, record.id);
                    showToast('Record deleted', 'success');
                    _loadHealthTimeline(dogId);
                } catch (err) {
                    console.error('Delete health record failed:', err);
                    showToast('Failed to delete record', 'error');
                }
            });

            timeline.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load health records:', error);
        timeline.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load health records.</p>
            </div>
        `;
    }
}
