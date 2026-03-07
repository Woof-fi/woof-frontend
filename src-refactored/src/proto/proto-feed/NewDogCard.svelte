<script>
    let { dog } = $props();
</script>

<div class="new-dog-card">
    <div class="dog-top">
        <img
            class="dog-avatar"
            src={dog.profilePhoto}
            alt={dog.name}
        />
        <div class="dog-info">
            <div class="dog-heading">
                <i class="fas fa-paw dog-heading-icon"></i>
                <span class="dog-name">{dog.name}</span>
                <span class="dog-heading-text">just joined in {dog.territoryName}!</span>
            </div>
            <div class="dog-breed">{dog.breedName}</div>
        </div>
    </div>
    <div class="dog-actions">
        <button class="dog-hi-btn">
            <i class="fas fa-hand"></i> Say hi
        </button>
    </div>
</div>

<style>
.new-dog-card {
    background: linear-gradient(135deg, color-mix(in srgb, var(--woof-color-brand-primary-subtle) 60%, transparent), var(--woof-color-neutral-50));
    border-left: 4px solid var(--woof-color-brand-primary);
    border-radius: var(--woof-radius-md);
    padding: var(--woof-space-4);
    max-width: 500px;
    margin: 0 auto var(--woof-space-3);
}

.dog-top {
    display: flex;
    gap: var(--woof-space-3);
}

.dog-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.dog-info {
    flex: 1;
    min-width: 0;
}

.dog-heading {
    font-size: var(--woof-text-callout);
    line-height: var(--woof-lh-callout);
    color: var(--woof-color-neutral-900);
}

.dog-heading-icon {
    color: var(--woof-color-brand-primary);
    font-size: var(--woof-text-footnote);
    margin-right: var(--woof-space-1);
}

.dog-name {
    font-weight: var(--woof-font-weight-bold);
}

.dog-heading-text {
    color: var(--woof-color-neutral-500);
}

.dog-breed {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin-top: var(--woof-space-1);
}

.dog-actions {
    margin-top: var(--woof-space-3);
    display: flex;
    justify-content: flex-end;
}

.dog-hi-btn {
    background: none;
    border: 1.5px solid var(--woof-color-brand-primary);
    color: var(--woof-color-brand-primary);
    border-radius: var(--woof-radius-full);
    padding: var(--woof-space-1) var(--woof-space-4);
    font-size: var(--woof-text-footnote);
    font-weight: var(--woof-font-weight-semibold);
    font-family: var(--woof-font-family);
    cursor: pointer;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
}

.dog-hi-btn:hover {
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary-dark);
}
</style>
