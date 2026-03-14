<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let { dogs = [] } = $props();

    function handleImageError(e) {
        e.target.src = '/images/dog_profile_pic.jpg';
    }
</script>

{#if dogs.length > 0}
    <div class="sibling-dogs">
        <span class="sibling-dogs-label">
            <i class="fas fa-paw"></i> {t('profile.sameOwner')}
        </span>
        <div class="sibling-dogs-list">
            {#each dogs as dog (dog.id)}
                <a
                    href="/dog/{dog.slug || dog.id}"
                    data-link
                    class="sibling-dog"
                >
                    <img
                        src={dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                        alt={dog.name}
                        class="sibling-dog-avatar"
                        onerror={handleImageError}
                    />
                    <span class="sibling-dog-name">{dog.name}</span>
                </a>
            {/each}
        </div>
    </div>
{/if}

<style>
.sibling-dogs {
    padding: var(--woof-space-3) 0;
    margin-bottom: var(--woof-space-3);
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.sibling-dogs-label {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-500);
    margin-bottom: var(--woof-space-2);
}

.sibling-dogs-label i {
    font-size: var(--woof-text-caption-2);
}

.sibling-dogs-list {
    display: flex;
    gap: var(--woof-space-3);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.sibling-dogs-list::-webkit-scrollbar {
    display: none;
}

.sibling-dog {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-1);
    text-decoration: none;
    flex-shrink: 0;
    transition: opacity var(--woof-duration-fast);
}

.sibling-dog:hover {
    opacity: 0.8;
}

.sibling-dog-avatar {
    width: var(--woof-space-10);
    height: var(--woof-space-10);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    object-position: center;
    border: 2px solid var(--woof-color-neutral-200);
}

.sibling-dog-name {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-600);
    max-width: 56px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
}
</style>
