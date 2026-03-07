<script>
    import {
        login,
        register,
        confirmRegistration,
        resendConfirmationCode,
        forgotPassword,
        confirmNewPassword,
    } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';
    import { focusTrap } from '../actions/focus-trap.ts';
    import { modals, closeAuthModal as storeClose } from '../../js/modal-store.svelte.js';
    import { setAuthUser } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let mode = $state('login'); // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
    let pendingEmail = $state('');
    let pendingPassword = $state('');

    // Form fields
    let email = $state('');
    let password = $state('');
    let name = $state('');
    let verifyCode = $state('');
    let newPassword = $state('');
    let submitting = $state(false);
    let submitLabel = $state('');
    let resending = $state(false);

    const modeConfig = {
        login: {
            titleKey: 'auth.loginTitle',
            submitKey: 'auth.signIn',
            tabs: true,
            email: true,
            password: true,
            name: false,
            verify: false,
            newPassword: false,
            pwReqs: false,
            newPwReqs: false,
            forgotLink: true,
            resendLink: false,
            backLink: false,
        },
        register: {
            titleKey: 'auth.registerTitle',
            submitKey: 'auth.signUp',
            tabs: true,
            email: true,
            password: true,
            name: true,
            verify: false,
            newPassword: false,
            pwReqs: true,
            newPwReqs: false,
            forgotLink: false,
            resendLink: false,
            backLink: false,
        },
        verify: {
            titleKey: 'auth.verifyTitle',
            submitKey: 'auth.verify',
            tabs: false,
            email: false,
            password: false,
            name: false,
            verify: true,
            newPassword: false,
            pwReqs: false,
            newPwReqs: false,
            forgotLink: false,
            resendLink: true,
            backLink: true,
        },
        forgot: {
            titleKey: 'auth.forgotTitle',
            submitKey: 'auth.sendResetCode',
            tabs: false,
            email: true,
            password: false,
            name: false,
            verify: false,
            newPassword: false,
            pwReqs: false,
            newPwReqs: false,
            forgotLink: false,
            resendLink: false,
            backLink: true,
        },
        reset: {
            titleKey: 'auth.resetTitle',
            submitKey: 'auth.resetPassword',
            tabs: false,
            email: false,
            password: false,
            name: false,
            verify: true,
            newPassword: true,
            pwReqs: false,
            newPwReqs: true,
            forgotLink: false,
            resendLink: false,
            backLink: true,
        },
    };

    let cfg = $derived(modeConfig[mode]);

    function checkPasswordRules(val) {
        return {
            length: val.length >= 8,
            uppercase: /[A-Z]/.test(val),
            lowercase: /[a-z]/.test(val),
            number: /[0-9]/.test(val),
            symbol: /[^A-Za-z0-9]/.test(val),
        };
    }

    let pwRules = $derived(checkPasswordRules(password));
    let newPwRules = $derived(checkPasswordRules(newPassword));

    // Manage body scroll + modal history based on store state
    $effect(() => {
        if (modals.authModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.authModalOpen) return;
        storeClose();
        // Reset form
        email = '';
        password = '';
        name = '';
        verifyCode = '';
        newPassword = '';
        pendingEmail = '';
        pendingPassword = '';
    }

    function handleKey(e) {
        if (e.key === 'Escape') close();
    }

    // Track mousedown target to prevent Chrome autofill popup from
    // triggering overlay-close (mousedown on popup, mouseup on overlay).
    let overlayMouseDownTarget = null;

    function handleOverlayMousedown(e) {
        overlayMouseDownTarget = e.target;
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget && overlayMouseDownTarget === e.currentTarget) {
            close();
        }
        overlayMouseDownTarget = null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        submitting = true;

        try {
            switch (mode) {
                case 'login': {
                    submitLabel = t('auth.loggingIn');
                    await login(email, password);
                    setAuthUser({ authenticated: true });
                    close();
                    email = '';
                    password = '';
                    break;
                }
                case 'register': {
                    submitLabel = t('auth.registering');
                    await register(email, password, name);
                    pendingEmail = email;
                    pendingPassword = password;
                    email = '';
                    password = '';
                    name = '';
                    mode = 'verify';
                    break;
                }
                case 'verify': {
                    submitLabel = t('auth.verifying');
                    await confirmRegistration(pendingEmail, verifyCode);
                    verifyCode = '';
                    try {
                        await login(pendingEmail, pendingPassword);
                        setAuthUser({ authenticated: true });
                        pendingPassword = '';
                        close();
                    } catch {
                        pendingPassword = '';
                        showToast(t('auth.emailVerified'), 'success');
                        mode = 'login';
                    }
                    break;
                }
                case 'forgot': {
                    submitLabel = t('auth.sending');
                    await forgotPassword(email);
                    pendingEmail = email;
                    email = '';
                    mode = 'reset';
                    break;
                }
                case 'reset': {
                    submitLabel = t('auth.resetting');
                    await confirmNewPassword(pendingEmail, verifyCode, newPassword);
                    verifyCode = '';
                    newPassword = '';
                    mode = 'login';
                    break;
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
        } finally {
            submitting = false;
            submitLabel = '';
        }
    }

    async function handleResend(e) {
        e.preventDefault();
        if (!pendingEmail || resending) return;
        resending = true;
        try {
            await resendConfirmationCode(pendingEmail);
            showToast(t('auth.codeResent'), 'success');
        } catch (err) {
            console.error('Resend error:', err);
        } finally {
            resending = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="auth-modal"
    class="modal"
    style:display={modals.authModalOpen ? 'block' : 'none'}
    onmousedown={handleOverlayMousedown}
    onclick={handleOverlayClick}
    onkeydown={(e) => e.key === 'Escape' && close()}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="auth-modal-title"
>
    <div class="modal-content" use:focusTrap>
        <div class="modal-header">
            <h2 id="auth-modal-title">{t(cfg.titleKey)}</h2>
            <button class="modal-close" aria-label={t('auth.close')} onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            {#if cfg.tabs}
                <div id="auth-tabs" class="auth-tabs">
                    <button
                        class="auth-tab"
                        class:active={mode === 'login'}
                        data-tab="login"
                        onclick={() => mode = 'login'}
                    >{t('auth.loginTitle')}</button>
                    <button
                        class="auth-tab"
                        class:active={mode === 'register'}
                        data-tab="register"
                        onclick={() => mode = 'register'}
                    >{t('auth.registerTitle')}</button>
                </div>
            {/if}

            <form id="auth-form" onsubmit={handleSubmit}>
                {#if cfg.email}
                    <div class="form-group" id="auth-email-group">
                        <label for="auth-email">{t('auth.email')}</label>
                        <input
                            type="email"
                            id="auth-email"
                            autocomplete="email"
                            required={cfg.email}
                            bind:value={email}
                        />
                    </div>
                {/if}

                {#if cfg.password}
                    <div class="form-group" id="auth-password-group">
                        <label for="auth-password">{t('auth.password')}</label>
                        <input
                            type="password"
                            id="auth-password"
                            autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
                            passwordrules={mode === 'register'
                                ? 'minlength: 8; required: upper; required: lower; required: digit; required: special;'
                                : undefined}
                            required={cfg.password}
                            bind:value={password}
                        />
                        {#if cfg.pwReqs}
                            <ul id="password-requirements" class="password-requirements" aria-live="polite">
                                <li id="req-length" class:met={pwRules.length}>{t('auth.pwReqLength')}</li>
                                <li id="req-uppercase" class:met={pwRules.uppercase}>{t('auth.pwReqUppercase')}</li>
                                <li id="req-lowercase" class:met={pwRules.lowercase}>{t('auth.pwReqLowercase')}</li>
                                <li id="req-number" class:met={pwRules.number}>{t('auth.pwReqNumber')}</li>
                                <li id="req-symbol" class:met={pwRules.symbol}>{t('auth.pwReqSymbol')}</li>
                            </ul>
                        {/if}
                    </div>
                {/if}

                {#if cfg.name}
                    <div class="form-group" id="auth-name-group">
                        <label for="auth-name">{t('auth.name')}</label>
                        <input type="text" id="auth-name" autocomplete="name" bind:value={name} />
                    </div>
                {/if}

                {#if cfg.verify}
                    <div class="form-group" id="auth-verify-group">
                        <label for="auth-verify-code">{t('auth.verificationCode')}</label>
                        <input
                            type="text"
                            id="auth-verify-code"
                            placeholder={t('auth.codePlaceholder')}
                            maxlength="6"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            required={cfg.verify}
                            bind:value={verifyCode}
                        />
                    </div>
                {/if}

                {#if cfg.newPassword}
                    <div class="form-group" id="auth-new-password-group">
                        <label for="auth-new-password">{t('auth.newPassword')}</label>
                        <input
                            type="password"
                            id="auth-new-password"
                            autocomplete="new-password"
                            required={cfg.newPassword}
                            bind:value={newPassword}
                        />
                        {#if cfg.newPwReqs}
                            <ul id="new-password-requirements" class="password-requirements" aria-live="polite">
                                <li id="new-req-length" class:met={newPwRules.length}>{t('auth.pwReqLength')}</li>
                                <li id="new-req-uppercase" class:met={newPwRules.uppercase}>{t('auth.pwReqUppercase')}</li>
                                <li id="new-req-lowercase" class:met={newPwRules.lowercase}>{t('auth.pwReqLowercase')}</li>
                                <li id="new-req-number" class:met={newPwRules.number}>{t('auth.pwReqNumber')}</li>
                                <li id="new-req-symbol" class:met={newPwRules.symbol}>{t('auth.pwReqSymbol')}</li>
                            </ul>
                        {/if}
                    </div>
                {/if}

                {#if mode === 'register'}
                    <p class="auth-age-notice">
                        {t('auth.ageNotice', { age: 13 })}
                        {t('auth.agreePrefix')}
                        <a href="/terms" data-link onclick={() => close()}>{t('auth.termsOfService')}</a>
                        {t('auth.and')} <a href="/privacy" data-link onclick={() => close()}>{t('auth.privacyPolicy')}</a>.
                    </p>
                {/if}

                <button type="submit" class="btn-primary" id="auth-submit" disabled={submitting}>
                    {submitting ? submitLabel : t(cfg.submitKey)}
                </button>

                {#if cfg.forgotLink}
                    <p id="auth-forgot-link" class="auth-secondary-action">
                        <button type="button" id="forgot-password-btn" class="link-btn" onclick={() => mode = 'forgot'}>
                            {t('auth.forgotPassword')}
                        </button>
                    </p>
                {/if}

                {#if cfg.resendLink}
                    <p id="auth-resend-group" class="auth-secondary-action">
                        <button type="button" id="resend-code-btn" class="link-btn" onclick={handleResend} disabled={resending}>
                            {t('auth.resendCode')}
                        </button>
                    </p>
                {/if}

                {#if cfg.backLink}
                    <p id="auth-back-group" class="auth-secondary-action">
                        <button type="button" id="back-to-login-btn" class="link-btn" onclick={() => mode = 'login'}>
                            &larr; {t('auth.backToLogin')}
                        </button>
                    </p>
                {/if}
            </form>
        </div>
    </div>
</div>

<style>
/* Password requirements */
.password-requirements {
    list-style: none;
    padding: 0;
    margin: var(--woof-space-2) 0 0;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
}

.password-requirements li {
    padding: 2px 0;
}

.password-requirements li::before {
    content: '○ ';
    color: var(--woof-color-neutral-400);
}

.password-requirements li.met {
    color: var(--woof-color-success);
}

.password-requirements li.met::before {
    content: '● ';
}

/* Auth tabs */
.auth-tabs {
    display: flex;
    margin-bottom: var(--woof-space-5);
    border-bottom: 1px solid var(--woof-color-neutral-200);
}

.auth-tab {
    flex: 1;
    padding: var(--woof-space-3) 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: var(--woof-text-callout);
    font-weight: 600;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    transition: color var(--woof-duration-fast), border-color var(--woof-duration-fast);
    text-align: center;
}

.auth-tab:hover {
    color: var(--woof-color-neutral-900);
}

.auth-tab.active {
    color: var(--woof-color-brand-primary);
    border-bottom-color: var(--woof-color-brand-primary);
}

.auth-secondary-action {
    text-align: center;
    margin-top: var(--woof-space-3);
    margin-bottom: 0;
    font-size: var(--woof-text-footnote);
}

.auth-age-notice {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    text-align: center;
    margin: var(--woof-space-2) 0 var(--woof-space-1);
    line-height: 1.5;
}

.auth-age-notice a {
    color: var(--woof-color-brand-primary);
    text-decoration: none;
}

.auth-age-notice a:hover {
    text-decoration: underline;
}
</style>
