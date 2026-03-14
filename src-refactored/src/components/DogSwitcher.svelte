<script>
    import { store, setCurrentDog } from '../../js/svelte-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let { dogs = [], onswitch = null } = $props();

    function handleSelect(dog) {
        if (store.currentDog?.id === dog.id) {
            // Already active — navigate to profile
            const path = `/dog/${dog.slug || dog.name.toLowerCase()}`;
            history.pushState({}, '', path);
            window.dispatchEvent(new CustomEvent('routechange'));
            onswitch?.();
            return;
        }
        setCurrentDog(dog);
        showToast(t('dogSwitcher.switchedTo').replace('{name}', dog.name), 'success');
        onswitch?.();
    }

    function handleImageError(e) {
        e.target.src = '/images/dog_profile_pic.jpg';
    }
</script>

{#if dogs.length >= 2}
    <div class="dog-switcher" role="radiogroup" aria-label={t('dogSwitcher.label')}>
        {#each dogs as dog (dog.id)}
            <button
                type="button"
                class="dog-switcher-item"
                class:active={store.currentDog?.id === dog.id}
                onclick={() => handleSelect(dog)}
                role="radio"
                aria-checked={store.currentDog?.id === dog.id}
                aria-label={store.currentDog?.id === dog.id ? `${dog.name} - ${t('dogSwitcher.viewProfile')}` : dog.name}
            >
                <img
                    src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                    alt={dog.name}
                    class="dog-switcher-avatar"
                    onerror={handleImageError}
                />
                <span class="dog-switcher-name">{dog.name}</span>
            </button>
        {/each}
    </div>
{/if}

<style>
.dog-switcher {
    display: flex;
    gap: var(--woof-space-3);
    padding: var(--woof-space-2) var(--woof-space-3);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.dog-switcher::-webkit-scrollbar {
    display: none;
}

.dog-switcher-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-1);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--woof-space-1);
    border-radius: var(--woof-radius-sm);
    transition: opacity var(--woof-duration-fast);
    flex-shrink: 0;
    font-family: inherit;
}

.dog-switcher-item:hover {
    opacity: 0.8;
}

.dog-switcher-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    object-position: center;
    border: 2px solid transparent;
    transition: border-color var(--woof-duration-fast), width var(--woof-duration-fast), height var(--woof-duration-fast);
}

.dog-switcher-item.active .dog-switcher-avatar {
    width: 44px;
    height: 44px;
    border-color: var(--woof-color-brand-primary);
}

.dog-switcher-name {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-600);
    max-width: 56px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
}

.dog-switcher-item.active .dog-switcher-name {
    color: var(--woof-color-neutral-900);
    font-weight: var(--woof-font-weight-semibold);
}
</style>
