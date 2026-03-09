<script>
    import { t, localName } from '../../js/i18n-store.svelte.js';

    let {
        dogSlug = '',
        username = '',
        profilePic = '',
        breedName = '',
        breedSlug = '',
        territoryName = '',
        territoryType = '',
        territoryParentName = '',
        territoryGrandparentName = '',
        territoryUrlPath = '',
        parkName = '',
        parkNameFi = '',
        parkSlug = '',
        isOwnPost = false,
        id = '',
        dogId = '',
        caption = '',
        onOptionsClick = null,
    } = $props();

    const parkDisplayName = $derived(localName({ name: parkName, nameFi: parkNameFi }));

    const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23cccccc" width="150" height="150"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDog%3C/text%3E%3C/svg%3E';
</script>

<div class="post-header">
    {#if dogSlug}
        <a href="/dog/{dogSlug}" data-link class="post-avatar-link">
            <img
                src={profilePic || FALLBACK_AVATAR}
                alt="{username}'s profile picture"
                onerror={(e) => { if (e.target.src !== FALLBACK_AVATAR) e.target.src = FALLBACK_AVATAR; }}
            />
        </a>
    {:else}
        <img
            src={profilePic || FALLBACK_AVATAR}
            alt="{username}'s profile picture"
            onerror={(e) => { if (e.target.src !== FALLBACK_AVATAR) e.target.src = FALLBACK_AVATAR; }}
        />
    {/if}
    <div class="post-author-info">
        {#if dogSlug}
            <a href="/dog/{dogSlug}" data-link class="post-author-name">{username}</a>
        {:else}
            <strong>{username}</strong>
        {/if}
        <span class="post-meta-line">
            {#if breedSlug}
                <a href="/breed/{breedSlug}" data-link class="post-breed-link">{breedName}</a>
            {:else if breedName}
                <span>{breedName}</span>
            {/if}
            {#if territoryName}
                {#if breedSlug || breedName}
                    <span class="post-meta-dot">&middot;</span>
                {/if}
                {@const territoryDisplay = territoryType === 'sub_district' && territoryParentName && territoryGrandparentName
                    ? `${territoryName}, ${territoryParentName}, ${territoryGrandparentName}`
                    : territoryType === 'district' && territoryParentName
                        ? `${territoryName}, ${territoryParentName}`
                        : territoryName}
                {#if territoryUrlPath}
                    <a href="/territory/{territoryUrlPath}" data-link class="post-location-text">{territoryDisplay}</a>
                {:else}
                    <span class="post-location-text">{territoryDisplay}</span>
                {/if}
            {/if}
            {#if parkSlug && parkDisplayName}
                {#if breedSlug || breedName || territoryName}
                    <span class="post-meta-dot">&middot;</span>
                {/if}
                <a href="/dog-park/{parkSlug}" data-link class="post-park-link">
                    <i class="fas fa-location-dot post-park-icon" aria-hidden="true"></i>
                    {parkDisplayName}
                </a>
            {/if}
        </span>
    </div>
    {#if id}
        <button
            class="post-options-btn"
            aria-label={t('post.postOptions')}
            onclick={() => onOptionsClick?.()}
        >
            <i class="fas fa-ellipsis" aria-hidden="true"></i>
        </button>
    {/if}
</div>

<style>
.post-header {
    padding: var(--woof-space-2) var(--woof-space-3);
    display: flex;
    align-items: center;
    gap: 0;
}

.post-header img {
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    margin-right: var(--woof-space-2);
    flex-shrink: 0;
}

.post-avatar-link {
    flex-shrink: 0;
}

.post-author-name {
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    text-decoration: none;
}

.post-author-name:hover {
    text-decoration: underline;
}

.post-author-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
}

.post-meta-line {
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    min-width: 0;
}

.post-breed-link {
    color: var(--woof-color-neutral-500);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post-breed-link:hover {
    color: var(--woof-color-brand-primary);
    text-decoration: underline;
}

.post-meta-dot {
    flex-shrink: 0;
    color: var(--woof-color-neutral-400);
}

.post-location-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    color: inherit;
}

a.post-location-text:hover {
    text-decoration: underline;
}

.post-park-link {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--woof-color-neutral-500);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
}

.post-park-link:hover {
    color: var(--woof-color-brand-primary);
    text-decoration: underline;
}

.post-park-icon {
    font-size: 0.7em;
    flex-shrink: 0;
}

.post-options-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--woof-color-neutral-500);
    font-size: var(--woof-font-size-base);
    padding: var(--woof-space-1) var(--woof-space-2);
    border-radius: var(--woof-radius-sm);
    line-height: 1;
    display: flex;
    align-items: center;
}

.post-options-btn:hover {
    color: var(--woof-color-neutral-900);
    background: var(--woof-color-neutral-100);
}
</style>
