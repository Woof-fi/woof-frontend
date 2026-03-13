<script>
    import { t } from '../../js/i18n-store.svelte.js';

    let {
        isFollowing = false,
        followLoading = false,
        onFollowToggle = null,
        onMessage = null,
    } = $props();
</script>

<div class="profile-follow-sticky" id="profile-follow-sticky">
    <div class="profile-follow-actions">
        <button
            class="follow-btn"
            class:following={isFollowing}
            disabled={followLoading}
            onclick={onFollowToggle}
        >
            {#key `${followLoading}-${isFollowing}`}
                {#if followLoading}
                    <span class="btn-content"><span class="woof-spinner"></span></span>
                {:else if isFollowing}
                    <span class="btn-content"><i class="fas fa-user-check"></i> {t('profile.followingBtn')}</span>
                {:else}
                    <span class="btn-content"><i class="fas fa-user-plus"></i> {t('profile.followBtn')}</span>
                {/if}
            {/key}
        </button>
        <button
            class="message-profile-btn icon-only"
            title={t('profile.message')}
            aria-label={t('profile.message')}
            onclick={onMessage}
        >
            <i class="fas fa-envelope"></i>
        </button>
    </div>
</div>

<style>
.profile-follow-sticky {
    position: fixed;
    bottom: 0;
    left: 280px;
    right: 0;
    padding: 12px 20px 16px 20px;
    background: linear-gradient(to top, rgba(255,255,255,1) 55%, rgba(255,255,255,0));
    z-index: 50;
    pointer-events: none;
}

.profile-follow-sticky:empty {
    display: none;
}

.profile-follow-actions {
    display: flex;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto;
    pointer-events: all;
}

.profile-follow-actions .follow-btn {
    flex: 1;
    height: var(--woof-btn-height-lg);
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
}

.profile-follow-actions .message-profile-btn.icon-only {
    width: var(--woof-btn-height-lg);
    height: var(--woof-btn-height-lg);
    padding: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

.follow-btn {
    padding: 6px 20px;
    border: none;
    border-radius: var(--woof-btn-radius);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-subheadline);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--woof-duration-fast);
}

.follow-btn:hover {
    background: var(--woof-color-brand-primary-dark);
}

.follow-btn.following {
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-900);
    border: 1px solid var(--woof-color-neutral-200);
}

.follow-btn.following:hover {
    background: var(--woof-color-brand-primary-subtle);
    color: var(--woof-color-brand-primary);
    border-color: var(--woof-color-brand-primary);
}

.btn-content {
    display: contents;
}

.follow-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.message-profile-btn {
    padding: 8px 16px;
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-btn-radius);
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-900);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.message-profile-btn:hover {
    background-color: var(--woof-color-neutral-100);
}

@media (max-width: 768px) {
    .profile-follow-sticky {
        left: 0;
        bottom: 56px;
        padding: 12px 20px 12px 20px;
    }
}
</style>
