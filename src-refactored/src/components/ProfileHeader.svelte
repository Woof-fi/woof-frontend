<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        dog,
        postsCount = 0,
        postsLoading = false,
        followerCount = 0,
        followingCount = 0,
        isOwner = false,
        onEditClick = null,
        onFollowersClick = null,
        onFollowingClick = null,
    } = $props();

    function formatAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        const dob = new Date(dateOfBirth + 'T00:00:00');
        const now = new Date();
        const diffMs = now - dob;
        const totalMonths = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        if (years === 0 && months === 0) return t('profile.newborn');
        if (years === 0) return months === 1
            ? t('profile.monthSingular', { count: months })
            : t('profile.monthPlural', { count: months });
        if (months === 0) return years === 1
            ? t('profile.yearSingular', { count: years })
            : t('profile.yearPlural', { count: years });
        return t('profile.yearMonth', { years, months });
    }

    function fallbackImg(e) {
        const img = e.currentTarget;
        const fallback = '/images/dog_profile_pic.jpg';
        if (img.src && !img.src.endsWith(fallback)) img.src = fallback;
    }
</script>

<div class="profile-header-content">
    <div class="profile-sheet-namerow">
        <div>
            <div class="profile-sheet-name">{dog.name}</div>
            <a href="/breed/{dog.breedSlug}" data-link class="profile-sheet-breed"><i class="fas fa-paw"></i> {dog.breedName}</a>
            {#if dog.territoryName}
                {@const territoryDisplay = dog.territoryType === 'sub_district' && dog.territoryParentName && dog.territoryGrandparentName
                    ? `${dog.territoryName}, ${dog.territoryParentName}, ${dog.territoryGrandparentName}`
                    : dog.territoryType === 'district' && dog.territoryParentName
                        ? `${dog.territoryName}, ${dog.territoryParentName}`
                        : dog.territoryName}
                {#if dog.territoryUrlPath}
                    <a href="/territory/{dog.territoryUrlPath}" data-link class="profile-sheet-territory"><i class="fas fa-location-dot"></i> {territoryDisplay}</a>
                {:else}
                    <span class="profile-sheet-territory"><i class="fas fa-location-dot"></i> {territoryDisplay}</span>
                {/if}
            {/if}
            {#if dog.dateOfBirth}
                <span class="profile-sheet-age"><i class="fas fa-cake-candles"></i> {formatAge(dog.dateOfBirth)}</span>
            {:else if dog.age != null}
                <span class="profile-sheet-age"><i class="fas fa-cake-candles"></i> {dog.age === 1 ? t('profile.yearSingular', { count: dog.age }) : t('profile.yearPlural', { count: dog.age })}</span>
            {/if}
        </div>
        {#if isOwner}
            <button class="edit-profile-btn" onclick={onEditClick}>
                <i class="fas fa-pen-to-square"></i> {t('profile.editProfile')}
            </button>
        {/if}
    </div>
    <div class="profile-sheet-stats">
        <div class="profile-sheet-stat">
            <div class="profile-sheet-stat-num">{postsLoading ? '\u2014' : postsCount}</div>
            <div class="profile-sheet-stat-label">{t('profile.posts')}</div>
        </div>
        <button class="profile-sheet-stat profile-sheet-stat-clickable" aria-label="{followerCount} {t('profile.followers')}" onclick={onFollowersClick}>
            <div class="profile-sheet-stat-num">{followerCount}</div>
            <div class="profile-sheet-stat-label">{t('profile.followers')}</div>
        </button>
        <button class="profile-sheet-stat profile-sheet-stat-clickable" aria-label="{followingCount} {t('profile.following')}" onclick={onFollowingClick}>
            <div class="profile-sheet-stat-num">{followingCount}</div>
            <div class="profile-sheet-stat-label">{t('profile.following')}</div>
        </button>
    </div>
    {#if dog.bio}
        <p class="profile-sheet-bio">{dog.bio}</p>
    {/if}
    {#if isOwner && !dog.territoryId}
        <div class="territory-nudge">
            <span class="territory-nudge-text">
                <i class="fas fa-location-dot"></i>
                {t('dog.territoryHint')}
            </span>
            <button class="territory-nudge-btn" onclick={onEditClick}>Set</button>
        </div>
    {/if}
</div>

<style>
.profile-header-content {
    padding: 0;
}

.profile-sheet-namerow {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
}

.profile-sheet-name {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    letter-spacing: -0.5px;
    line-height: 1.1;
}

.profile-sheet-breed {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-brand-primary);
    font-weight: var(--woof-font-weight-semibold);
    margin-top: 6px;
    text-decoration: none;
}

.profile-sheet-breed:hover {
    text-decoration: underline;
}

a.profile-sheet-territory {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 4px;
    text-decoration: none;
}

a.profile-sheet-territory:hover {
    text-decoration: underline;
}

span.profile-sheet-territory {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 4px;
}

.profile-sheet-territory i,
a.profile-sheet-territory i {
    font-size: 11px;
}

.profile-sheet-age {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 4px;
}

.profile-sheet-age i {
    font-size: 11px;
}

.territory-nudge {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3);
    background: var(--woof-color-brand-primary-subtle);
    border-radius: var(--woof-radius-md);
    margin-bottom: var(--woof-space-4);
}

.territory-nudge-text {
    flex: 1;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-700);
    line-height: 1.4;
}

.territory-nudge-text i {
    color: var(--woof-color-brand-primary);
    margin-right: var(--woof-space-1);
}

.territory-nudge-btn {
    flex-shrink: 0;
    padding: var(--woof-space-1) var(--woof-space-3);
    border: 1px solid var(--woof-color-brand-primary);
    border-radius: var(--woof-btn-radius);
    background: transparent;
    color: var(--woof-color-brand-primary);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
}

.territory-nudge-btn:hover {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
}

.profile-sheet-stats {
    display: flex;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.profile-sheet-stat {
    flex: 1;
    padding-right: 16px;
    margin-right: 16px;
    border-right: 1px solid var(--woof-color-neutral-200);
}

.profile-sheet-stat:last-child {
    border-right: none;
    padding-right: 0;
    margin-right: 0;
}

.profile-sheet-stat-num {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-heavy);
    color: var(--woof-color-neutral-900);
    line-height: 1;
}

.profile-sheet-stat-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-top: 3px;
}

.profile-sheet-stat-clickable {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    text-align: left;
    transition: opacity var(--woof-duration-fast);
}

.profile-sheet-stat-clickable:hover {
    opacity: 0.7;
}

.profile-sheet-bio {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-700);
    line-height: 1.5;
    margin-bottom: 16px;
}

.edit-profile-btn {
    padding: 6px 16px;
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-btn-radius);
    background: var(--woof-surface-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}

.edit-profile-btn:hover {
    background: var(--woof-color-neutral-100);
}
</style>
