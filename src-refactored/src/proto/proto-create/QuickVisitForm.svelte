<script>
    import { MOCK_DOGS, MOCK_PARKS } from '../mock-data.js';
    import { showToast } from '../../../js/utils.js';

    let { onback = null, onclose = null } = $props();

    let selectedDog = $state(MOCK_DOGS[0].id);
    let selectedPark = $state(MOCK_PARKS[0].id);
    let duration = $state('60');
    let note = $state('');

    // Default to 1 hour from now, rounded to nearest 15 min
    function getDefaultTime() {
        const d = new Date(Date.now() + 3600000);
        d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    }

    let visitTime = $state(getDefaultTime());

    function handleSubmit(e) {
        e.preventDefault();
        showToast('Visit scheduled!', 'success');
        onclose?.();
    }
</script>

<div class="quick-form">
    <div class="quick-form-header">
        <button class="back-btn" aria-label="Back" onclick={() => onback?.()}>
            <i class="fas fa-arrow-left"></i>
        </button>
        <h3 class="quick-form-title">Schedule a park visit</h3>
    </div>

    <form onsubmit={handleSubmit}>
        <div class="form-group">
            <label class="form-label" for="visit-dog">Dog</label>
            <select id="visit-dog" class="form-select" bind:value={selectedDog}>
                {#each MOCK_DOGS as dog}
                    <option value={dog.id}>{dog.name} ({dog.breedName})</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="visit-park">Park</label>
            <select id="visit-park" class="form-select" bind:value={selectedPark}>
                {#each MOCK_PARKS as park}
                    <option value={park.id}>{park.name}</option>
                {/each}
            </select>
        </div>

        <div class="form-row">
            <div class="form-group form-group-half">
                <label class="form-label" for="visit-time">Time</label>
                <input
                    id="visit-time"
                    type="datetime-local"
                    class="form-input"
                    bind:value={visitTime}
                />
            </div>

            <div class="form-group form-group-half">
                <label class="form-label" for="visit-duration">Duration</label>
                <select id="visit-duration" class="form-select" bind:value={duration}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label" for="visit-note">Note (optional)</label>
            <input
                id="visit-note"
                type="text"
                class="form-input"
                placeholder="Anyone want to join?"
                maxlength="200"
                bind:value={note}
            />
        </div>

        <button type="submit" class="submit-btn">
            <i class="fas fa-calendar-check"></i>
            Schedule Visit
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

.submit-btn:hover {
    background: var(--woof-color-brand-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--woof-shadow-brand);
}

.submit-btn:active {
    transform: translateY(0);
}
</style>
