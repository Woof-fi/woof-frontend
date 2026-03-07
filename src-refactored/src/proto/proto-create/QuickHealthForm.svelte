<script>
    import { MOCK_DOGS, HEALTH_RECORD_TYPES } from '../mock-data.js';
    import { showToast } from '../../../js/utils.js';

    let { onback = null, onclose = null } = $props();

    let selectedDog = $state(MOCK_DOGS[0].id);
    let recordType = $state(HEALTH_RECORD_TYPES[0].value);
    let notes = $state('');
    let weight = $state('');

    function getTodayStr() {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 10);
    }

    let recordDate = $state(getTodayStr());

    let isWeightType = $derived(recordType === 'weight');

    function handleSubmit(e) {
        e.preventDefault();
        showToast('Health record saved!', 'success');
        onclose?.();
    }
</script>

<div class="quick-form">
    <div class="quick-form-header">
        <button class="back-btn" onclick={() => onback?.()}>
            <i class="fas fa-arrow-left"></i>
        </button>
        <h3 class="quick-form-title">Log a health record</h3>
    </div>

    <form onsubmit={handleSubmit}>
        <div class="form-group">
            <label class="form-label" for="health-dog">Dog</label>
            <select id="health-dog" class="form-select" bind:value={selectedDog}>
                {#each MOCK_DOGS as dog}
                    <option value={dog.id}>{dog.name} ({dog.breedName})</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="health-type">Record type</label>
            <select id="health-type" class="form-select" bind:value={recordType}>
                {#each HEALTH_RECORD_TYPES as type}
                    <option value={type.value}>{type.label}</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="health-date">Date</label>
            <input
                id="health-date"
                type="date"
                class="form-input"
                bind:value={recordDate}
            />
        </div>

        {#if isWeightType}
            <div class="form-group">
                <label class="form-label" for="health-weight">Weight (kg)</label>
                <input
                    id="health-weight"
                    type="number"
                    class="form-input"
                    placeholder="e.g. 25.5"
                    step="0.1"
                    min="0"
                    max="200"
                    bind:value={weight}
                />
            </div>
        {/if}

        <div class="form-group">
            <label class="form-label" for="health-notes">Notes / description</label>
            <input
                id="health-notes"
                type="text"
                class="form-input"
                placeholder="Annual checkup, all clear"
                maxlength="500"
                bind:value={notes}
            />
        </div>

        <button type="submit" class="submit-btn">
            <i class="fas fa-circle-check"></i>
            Save Record
        </button>
    </form>
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

.form-group {
    margin-bottom: var(--woof-space-4);
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

.submit-btn:hover {
    background: var(--woof-color-brand-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--woof-shadow-brand);
}

.submit-btn:active {
    transform: translateY(0);
}
</style>
