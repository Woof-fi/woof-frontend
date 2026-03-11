<script>
    import { changePassword } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { modals, closeChangePasswordModal as storeClose } from '../../js/modal-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { store } from '../../js/svelte-store.svelte.js';
    import { focusTrap } from '../actions/focus-trap.ts';

    let currentPassword = $state('');
    let newPassword = $state('');
    let confirmPassword = $state('');
    let submitting = $state(false);
    let showCurrentPw = $state(false);
    let showNewPw = $state(false);
    let showConfirmPw = $state(false);

    let passwordsMatch = $derived(newPassword === confirmPassword);
    let hasUpper = $derived(/[A-Z]/.test(newPassword));
    let hasLower = $derived(/[a-z]/.test(newPassword));
    let hasNumber = $derived(/[0-9]/.test(newPassword));
    let hasSpecial = $derived(/[^A-Za-z0-9]/.test(newPassword));
    let hasMinLength = $derived(newPassword.length >= 8);
    let canSubmit = $derived(
        currentPassword.length > 0 &&
        hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial &&
        passwordsMatch &&
        !submitting
    );

    // Reset form when modal opens
    $effect(() => {
        if (modals.changePasswordModalOpen) {
            currentPassword = '';
            newPassword = '';
            confirmPassword = '';
            showCurrentPw = false;
            showNewPw = false;
            showConfirmPw = false;
        }
    });

    // Manage body scroll + modal history
    $effect(() => {
        if (modals.changePasswordModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.changePasswordModalOpen) return;
        storeClose();
    }

    function handleKey(e) {
        if (e.key === 'Escape') close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;

        submitting = true;
        try {
            await changePassword(currentPassword, newPassword);
            close();
        } catch {
            // Error toast already shown by auth.js
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="change-password-modal"
    class="modal"
    style:display={modals.changePasswordModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content" use:focusTrap>
        <div class="modal-header">
            <button class="modal-back" aria-label={t('common.close')} onclick={close}>
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>{t('settings.changePassword')}</h2>
            <button
                type="submit"
                form="change-password-form"
                class="modal-action"
                disabled={!canSubmit}
            >
                {submitting ? t('settings.updatingPassword') : t('settings.updatePassword')}
            </button>
        </div>
        <div class="modal-body">
            <form id="change-password-form" onsubmit={handleSubmit}>
                <!-- Hidden username for password managers & accessibility -->
                <input type="email" autocomplete="username" value={store.authUser?.email ?? ''} hidden aria-hidden="true" tabindex="-1" />
                <div class="pw-field">
                    <label for="cp-current">{t('settings.currentPassword')}</label>
                    <div class="pw-input-wrap">
                        <input
                            id="cp-current"
                            type={showCurrentPw ? 'text' : 'password'}
                            bind:value={currentPassword}
                            autocomplete="current-password"
                        />
                        <button
                            type="button"
                            class="pw-toggle"
                            onclick={() => showCurrentPw = !showCurrentPw}
                            aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                        >
                            <i class="fas {showCurrentPw ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                </div>

                <div class="pw-field">
                    <label for="cp-new">{t('settings.newPassword')}</label>
                    <div class="pw-input-wrap">
                        <input
                            id="cp-new"
                            type={showNewPw ? 'text' : 'password'}
                            bind:value={newPassword}
                            autocomplete="new-password"
                        />
                        <button
                            type="button"
                            class="pw-toggle"
                            onclick={() => showNewPw = !showNewPw}
                            aria-label={showNewPw ? 'Hide password' : 'Show password'}
                        >
                            <i class="fas {showNewPw ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                    {#if newPassword.length > 0}
                        <ul class="pw-requirements">
                            <li class:met={hasMinLength}><i class="fas {hasMinLength ? 'fa-check' : 'fa-times'}"></i> {t('auth.pwReqLength')}</li>
                            <li class:met={hasUpper}><i class="fas {hasUpper ? 'fa-check' : 'fa-times'}"></i> {t('auth.pwReqUppercase')}</li>
                            <li class:met={hasLower}><i class="fas {hasLower ? 'fa-check' : 'fa-times'}"></i> {t('auth.pwReqLowercase')}</li>
                            <li class:met={hasNumber}><i class="fas {hasNumber ? 'fa-check' : 'fa-times'}"></i> {t('auth.pwReqNumber')}</li>
                            <li class:met={hasSpecial}><i class="fas {hasSpecial ? 'fa-check' : 'fa-times'}"></i> {t('auth.pwReqSymbol')}</li>
                        </ul>
                    {/if}
                </div>

                <div class="pw-field">
                    <label for="cp-confirm">{t('settings.confirmPassword')}</label>
                    <div class="pw-input-wrap">
                        <input
                            id="cp-confirm"
                            type={showConfirmPw ? 'text' : 'password'}
                            class:error={confirmPassword.length > 0 && !passwordsMatch}
                            bind:value={confirmPassword}
                            autocomplete="new-password"
                        />
                        <button
                            type="button"
                            class="pw-toggle"
                            onclick={() => showConfirmPw = !showConfirmPw}
                            aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                        >
                            <i class="fas {showConfirmPw ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                    {#if confirmPassword.length > 0 && !passwordsMatch}
                        <span class="pw-error-hint">{t('settings.passwordMismatch')}</span>
                    {/if}
                </div>
            </form>
        </div>
    </div>
</div>

<style>
.modal-header {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-5);
}

.modal-header h2 {
    flex: 1;
    text-align: center;
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
}

.modal-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    border: none;
    background: none;
    color: var(--woof-color-neutral-700);
    font-size: var(--woof-text-body);
    cursor: pointer;
    border-radius: var(--woof-radius-full);
    transition: background var(--woof-duration-fast);
    flex-shrink: 0;
}

.modal-back:hover {
    background: var(--woof-color-neutral-100);
}

.modal-action {
    border: none;
    background: none;
    color: var(--woof-color-brand-primary);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    padding: var(--woof-space-2) var(--woof-space-3);
    border-radius: var(--woof-radius-sm);
    transition: opacity var(--woof-duration-fast);
    flex-shrink: 0;
}

.modal-action:hover {
    opacity: 0.8;
}

.modal-action:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.modal-body form {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-4);
}

.pw-field {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
}

.pw-field label {
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-600);
}

.pw-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.pw-field input {
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-sm);
    font-size: var(--woof-text-callout);
    font-family: inherit;
    background: var(--woof-color-neutral-50);
    color: var(--woof-color-neutral-900);
    transition: border-color var(--woof-duration-fast);
    box-sizing: border-box;
}

.pw-field input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-surface-primary);
}

.pw-field input.error {
    border-color: var(--woof-color-error);
}

.pw-input-wrap input {
    padding-right: var(--woof-space-8);
}

.pw-toggle {
    position: absolute;
    right: var(--woof-space-2);
    background: none;
    border: none;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    padding: var(--woof-space-1);
    font-size: var(--woof-text-callout);
    display: flex;
    align-items: center;
}

.pw-toggle:hover {
    color: var(--woof-color-neutral-600);
}

.pw-requirements {
    list-style: none;
    padding: 0;
    margin: var(--woof-space-1) 0 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.pw-requirements li {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-error);
    display: flex;
    align-items: center;
    gap: var(--woof-space-1);
}

.pw-requirements li.met {
    color: var(--woof-color-success);
}

.pw-error-hint {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-error);
}

@media (max-width: 768px) {
    .pw-field input {
        font-size: 16px;
    }
}
</style>
