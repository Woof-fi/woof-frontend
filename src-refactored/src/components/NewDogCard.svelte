<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let { dog } = $props();

    const FALLBACK_AVATAR = '/images/dog_profile_pic.jpg';
</script>

<a href="/dog/{dog.slug}" data-link class="new-dog-card">
    <div class="dog-top">
        <img
            class="dog-avatar"
            src={dog.profilePhoto || FALLBACK_AVATAR}
            alt={dog.name}
        />
        <div class="dog-info">
            <div class="dog-heading">
                <i class="fas fa-paw dog-heading-icon"></i>
                <span class="dog-name">{dog.name}</span>
                <span class="dog-heading-text">{t('feed.justJoinedIn')} {dog.territoryName}!</span>
            </div>
            <div class="dog-breed">{dog.breedName}</div>
        </div>
    </div>
</a>

<style>
.new-dog-card {
    display: block;
    background: linear-gradient(135deg, color-mix(in srgb, var(--woof-color-brand-primary-subtle) 60%, transparent), var(--woof-color-neutral-50));
    border-left: 4px solid var(--woof-color-brand-primary);
    border-radius: var(--woof-radius-md);
    padding: var(--woof-space-4);
    max-width: 500px;
    margin: 0 auto var(--woof-space-3);
    text-decoration: none;
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
</style>
