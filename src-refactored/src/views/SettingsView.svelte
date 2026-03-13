<script>
    import { isAuthenticated, logout, getCurrentUser } from '../../js/auth.js';
    import { deleteMyAccount } from '../../js/api.js';
    import { store, setAuthUser } from '../../js/svelte-store.svelte.js';
    import { openChangePasswordModal, openFeedbackModal } from '../../js/modal-store.svelte.js';
    import { t, locale, setLocale } from '../../js/i18n-store.svelte.js';
    import { showToast } from '../../js/utils.js';

    let { onopenAuthModal = null } = $props();

    // Delete account state
    let deleteConfirmText = $state('');
    let deletingAccount = $state(false);
    let showDeleteConfirm = $state(false);

    // Derived
    let authed = $derived(store.authUser !== null);
    let userEmail = $derived(store.authUser?.email || getCurrentUser()?.email || '');
    let canDeleteAccount = $derived(deleteConfirmText === 'DELETE' && !deletingAccount);

    function handleLogout() {
        logout();
        setAuthUser(null);
    }

    function toggleDeleteConfirm() {
        showDeleteConfirm = !showDeleteConfirm;
        deleteConfirmText = '';
    }

    async function handleDeleteAccount() {
        if (!canDeleteAccount) return;
        deletingAccount = true;
        try {
            await deleteMyAccount();
            logout();
            setAuthUser(null);
        } catch {
            showToast(t('settings.deleteFailed'), 'error');
            deletingAccount = false;
        }
    }
</script>

<div class="settings-view">
    <h1 class="settings-title">{t('settings.title')}</h1>

    {#if !authed}
        <div class="settings-empty">
            <div class="settings-empty-icon">
                <i class="fas fa-gear"></i>
            </div>
            <h2>{t('settings.loginRequired')}</h2>
            <button type="button" class="btn-primary" onclick={() => onopenAuthModal?.()}>
                {t('nav.login')}
            </button>
        </div>
    {:else}
        <!-- Section 1: App Preferences -->
        <section class="settings-section">
            <h2 class="settings-section-title">{t('settings.appPreferences')}</h2>
            <div class="settings-card">
                <div class="settings-row">
                    <span class="settings-label">{t('settings.language')}</span>
                    <div class="lang-picker" role="radiogroup" aria-label={t('settings.language')}>
                        <button
                            type="button"
                            class="lang-btn"
                            class:active={locale.current === 'en'}
                            onclick={() => setLocale('en')}
                            aria-checked={locale.current === 'en'}
                            role="radio"
                        >{t('language.en')}</button>
                        <button
                            type="button"
                            class="lang-btn"
                            class:active={locale.current === 'fi'}
                            onclick={() => setLocale('fi')}
                            aria-checked={locale.current === 'fi'}
                            role="radio"
                        >{t('language.fi')}</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 2: Feedback -->
        <section class="settings-section">
            <h2 class="settings-section-title">{t('feedback.sectionTitle')}</h2>
            <div class="settings-card">
                <button type="button" class="settings-row settings-row-action" onclick={openFeedbackModal}>
                    <span class="settings-row-icon-text">
                        <i class="fas fa-comment-dots"></i>
                        {t('feedback.giveFeedback')}
                    </span>
                    <i class="fas fa-chevron-right settings-row-chevron"></i>
                </button>
            </div>
        </section>

        <!-- Section 3: Account -->
        <section class="settings-section">
            <h2 class="settings-section-title">{t('settings.account')}</h2>
            <div class="settings-card">
                <!-- Email (read-only) -->
                <div class="settings-row">
                    <span class="settings-label">{t('settings.email')}</span>
                    <span class="settings-value">{userEmail}</span>
                </div>

                <div class="settings-divider"></div>

                <!-- Change Password — opens modal -->
                <button type="button" class="settings-row settings-row-action" onclick={openChangePasswordModal}>
                    <span class="settings-label">{t('settings.changePassword')}</span>
                    <i class="fas fa-chevron-right settings-row-chevron"></i>
                </button>
            </div>
        </section>

        <!-- Section 4: Account Actions -->
        <section class="settings-section">
            <h2 class="settings-section-title">{t('settings.accountActions')}</h2>
            <div class="settings-card">
                <!-- Logout -->
                <button type="button" class="settings-row settings-row-action" onclick={handleLogout}>
                    <span class="settings-row-icon-text">
                        <i class="fas fa-right-from-bracket"></i>
                        {t('settings.logoutBtn')}
                    </span>
                    <i class="fas fa-chevron-right settings-row-chevron"></i>
                </button>

                <div class="settings-divider"></div>

                <!-- Delete Account -->
                <button type="button" class="settings-row settings-row-action" onclick={toggleDeleteConfirm}>
                    <span class="settings-row-icon-text">
                        <i class="fas fa-trash-can"></i>
                        {t('settings.deleteAccount')}
                    </span>
                    <i class="fas {showDeleteConfirm ? 'fa-chevron-up' : 'fa-chevron-down'} settings-row-chevron"></i>
                </button>

                {#if showDeleteConfirm}
                    <div class="settings-delete-confirm">
                        <p class="settings-delete-warning">{t('settings.deleteWarning')}</p>
                        <label for="delete-confirm-input" class="settings-delete-instruction">
                            {t('settings.deleteInstruction')}
                        </label>
                        <input
                            id="delete-confirm-input"
                            type="text"
                            class="settings-input"
                            bind:value={deleteConfirmText}
                            placeholder="DELETE"
                            autocomplete="off"
                        />
                        <button
                            type="button"
                            class="btn-danger settings-delete-btn"
                            disabled={!canDeleteAccount}
                            onclick={handleDeleteAccount}
                        >
                            {deletingAccount ? t('settings.deleting') : t('settings.deleteConfirm')}
                        </button>
                    </div>
                {/if}
            </div>
        </section>
    {/if}
</div>

<style>
    .settings-view {
        max-width: 500px;
        margin: 0 auto;
        padding: var(--woof-space-4) 0 var(--woof-space-8);
    }

    .settings-title {
        font-size: var(--woof-text-title-2);
        font-weight: var(--woof-font-weight-bold);
        color: var(--woof-color-neutral-900);
        margin: 0 0 var(--woof-space-5);
        padding: 0 var(--woof-space-4);
    }

    /* Empty / login prompt */
    .settings-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--woof-space-3);
        padding: var(--woof-space-8) var(--woof-space-4);
        text-align: center;
    }

    .settings-empty-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--woof-radius-full);
        background: var(--woof-color-neutral-100);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--woof-text-title-2);
        color: var(--woof-color-neutral-400);
    }

    .settings-empty h2 {
        font-size: var(--woof-text-body);
        font-weight: var(--woof-font-weight-regular);
        color: var(--woof-color-neutral-500);
        margin: 0;
    }

    /* Sections */
    .settings-section {
        margin-bottom: var(--woof-space-5);
        padding: 0 var(--woof-space-4);
    }

    .settings-section-title {
        font-size: var(--woof-text-caption-1);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-400);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin: 0 0 var(--woof-space-2);
        padding-left: var(--woof-space-1);
    }

    /* Cards */
    .settings-card {
        background: var(--woof-surface-primary);
        border: 1px solid var(--woof-color-neutral-200);
        border-radius: var(--woof-radius-lg);
        overflow: hidden;
    }

    /* Rows */
    .settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--woof-space-3) var(--woof-space-4);
        font-size: var(--woof-text-callout);
        color: var(--woof-color-neutral-900);
        width: 100%;
        box-sizing: border-box;
        background: none;
        border: none;
        cursor: default;
        font-family: inherit;
        text-align: left;
    }

    .settings-row-action {
        cursor: pointer;
        transition: background-color var(--woof-duration-fast);
    }

    .settings-row-action:hover {
        background: var(--woof-color-neutral-50);
    }

    .settings-row-icon-text {
        display: flex;
        align-items: center;
        gap: var(--woof-space-2);
    }

    .settings-row-chevron {
        font-size: var(--woof-text-caption-1);
        color: var(--woof-color-neutral-300);
    }

    .settings-label {
        font-weight: var(--woof-font-weight-medium);
        color: var(--woof-color-neutral-700);
        flex-shrink: 0;
    }

    .settings-value {
        color: var(--woof-color-neutral-500);
        font-size: var(--woof-text-callout);
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        flex: 1;
        margin-left: var(--woof-space-3);
    }

    .settings-divider {
        height: 1px;
        background: var(--woof-color-neutral-200);
        margin: 0 var(--woof-space-4);
    }

    /* Language picker */
    .lang-picker {
        display: flex;
        gap: 2px;
        background: var(--woof-color-neutral-100);
        border-radius: var(--woof-radius-sm);
        padding: 2px;
        flex-shrink: 0;
    }

    .lang-btn {
        padding: var(--woof-space-1) var(--woof-space-3);
        border: none;
        background: none;
        border-radius: calc(var(--woof-radius-sm) - 2px);
        font-size: var(--woof-text-caption-1);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-400);
        cursor: pointer;
        transition: all var(--woof-duration-fast);
        font-family: inherit;
        white-space: nowrap;
    }

    .lang-btn.active {
        background: var(--woof-surface-primary);
        color: var(--woof-color-neutral-900);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    /* Primary button */
    .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--woof-btn-height-md);
        padding: 0 var(--woof-space-5);
        border: none;
        border-radius: var(--woof-radius-full);
        background: var(--woof-color-brand-primary);
        color: white;
        font-size: var(--woof-text-callout);
        font-weight: var(--woof-font-weight-semibold);
        font-family: inherit;
        cursor: pointer;
        transition: all var(--woof-duration-fast);
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--woof-color-brand-primary-dark);
        transform: translateY(-1px);
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Delete confirmation */
    .settings-delete-confirm {
        padding: var(--woof-space-4);
        background: var(--woof-color-neutral-50);
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-3);
    }

    .settings-delete-warning {
        font-size: var(--woof-text-footnote);
        color: var(--woof-color-neutral-600);
        line-height: var(--woof-line-height-body);
        margin: 0;
    }

    .settings-delete-instruction {
        font-size: var(--woof-text-caption-1);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-700);
    }

    .settings-input {
        width: 100%;
        padding: var(--woof-space-2) var(--woof-space-3);
        border: 1px solid var(--woof-color-neutral-200);
        border-radius: var(--woof-radius-sm);
        font-size: var(--woof-text-callout);
        font-family: inherit;
        background: var(--woof-surface-primary);
        color: var(--woof-color-neutral-900);
        transition: border-color var(--woof-duration-fast);
        box-sizing: border-box;
    }

    .settings-input:focus {
        outline: none;
        border-color: var(--woof-color-brand-primary);
    }

    /* Danger button — only appears on final delete confirmation */
    .btn-danger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: var(--woof-btn-height-md);
        padding: 0 var(--woof-space-5);
        border: none;
        border-radius: var(--woof-radius-md);
        background: var(--woof-color-error);
        color: white;
        font-size: var(--woof-text-callout);
        font-weight: var(--woof-font-weight-semibold);
        font-family: inherit;
        cursor: pointer;
        transition: all var(--woof-duration-fast);
    }

    .btn-danger:hover:not(:disabled) {
        opacity: 0.9;
    }

    .btn-danger:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    /* Mobile font size to prevent iOS zoom */
    @media (max-width: 768px) {
        .settings-input {
            font-size: 16px;
        }
    }
</style>
