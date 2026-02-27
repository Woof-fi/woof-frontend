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
    import { modals, closeAuthModal as storeClose } from '../../js/modal-store.svelte.js';
    import { setAuthUser } from '../../js/svelte-store.svelte.js';

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

    const modeConfig = {
        login: {
            title: 'Login',
            submit: 'Sign In',
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
            title: 'Register',
            submit: 'Sign Up',
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
            title: 'Verify Email',
            submit: 'Verify',
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
            title: 'Forgot Password',
            submit: 'Send Reset Code',
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
            title: 'Reset Password',
            submit: 'Reset Password',
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

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        submitting = true;
        const origLabel = cfg.submit;

        try {
            switch (mode) {
                case 'login': {
                    submitLabel = 'Logging in...';
                    await login(email, password);
                    setAuthUser({ authenticated: true });
                    close();
                    email = '';
                    password = '';
                    break;
                }
                case 'register': {
                    submitLabel = 'Registering...';
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
                    submitLabel = 'Verifying...';
                    await confirmRegistration(pendingEmail, verifyCode);
                    verifyCode = '';
                    try {
                        await login(pendingEmail, pendingPassword);
                        setAuthUser({ authenticated: true });
                        pendingPassword = '';
                        close();
                    } catch {
                        pendingPassword = '';
                        showToast('Email verified! Please sign in.', 'success');
                        mode = 'login';
                    }
                    break;
                }
                case 'forgot': {
                    submitLabel = 'Sending...';
                    await forgotPassword(email);
                    pendingEmail = email;
                    email = '';
                    mode = 'reset';
                    break;
                }
                case 'reset': {
                    submitLabel = 'Resetting...';
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
        if (!pendingEmail) return;
        try {
            await resendConfirmationCode(pendingEmail);
            showToast('Verification code resent', 'success');
        } catch (err) {
            console.error('Resend error:', err);
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="auth-modal"
    class="modal"
    style:display={modals.authModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={(e) => e.key === 'Escape' && close()}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="auth-modal-title"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="auth-modal-title">{cfg.title}</h2>
            <button class="modal-close" aria-label="Close" onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            {#if cfg.tabs}
                <div id="auth-tabs" class="auth-tabs">
                    <button
                        class="auth-tab"
                        class:active={mode === 'login'}
                        data-tab="login"
                        onclick={() => mode = 'login'}
                    >Login</button>
                    <button
                        class="auth-tab"
                        class:active={mode === 'register'}
                        data-tab="register"
                        onclick={() => mode = 'register'}
                    >Register</button>
                </div>
            {/if}

            <form id="auth-form" onsubmit={handleSubmit}>
                {#if cfg.email}
                    <div class="form-group" id="auth-email-group">
                        <label for="auth-email">Email</label>
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
                        <label for="auth-password">Password</label>
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
                                <li id="req-length" class:met={pwRules.length}>At least 8 characters</li>
                                <li id="req-uppercase" class:met={pwRules.uppercase}>An uppercase letter</li>
                                <li id="req-lowercase" class:met={pwRules.lowercase}>A lowercase letter</li>
                                <li id="req-number" class:met={pwRules.number}>A number</li>
                                <li id="req-symbol" class:met={pwRules.symbol}>A special character</li>
                            </ul>
                        {/if}
                    </div>
                {/if}

                {#if cfg.name}
                    <div class="form-group" id="auth-name-group">
                        <label for="auth-name">Name</label>
                        <input type="text" id="auth-name" autocomplete="name" bind:value={name} />
                    </div>
                {/if}

                {#if cfg.verify}
                    <div class="form-group" id="auth-verify-group">
                        <label for="auth-verify-code">Verification Code</label>
                        <input
                            type="text"
                            id="auth-verify-code"
                            placeholder="Enter 6-digit code"
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
                        <label for="auth-new-password">New Password</label>
                        <input
                            type="password"
                            id="auth-new-password"
                            autocomplete="new-password"
                            required={cfg.newPassword}
                            bind:value={newPassword}
                        />
                        {#if cfg.newPwReqs}
                            <ul id="new-password-requirements" class="password-requirements" aria-live="polite">
                                <li id="new-req-length" class:met={newPwRules.length}>At least 8 characters</li>
                                <li id="new-req-uppercase" class:met={newPwRules.uppercase}>An uppercase letter</li>
                                <li id="new-req-lowercase" class:met={newPwRules.lowercase}>A lowercase letter</li>
                                <li id="new-req-number" class:met={newPwRules.number}>A number</li>
                                <li id="new-req-symbol" class:met={newPwRules.symbol}>A special character</li>
                            </ul>
                        {/if}
                    </div>
                {/if}

                {#if mode === 'register'}
                    <p class="auth-age-notice">
                        You must be at least <strong>13 years old</strong> to use Woof.
                        By signing up you agree to our
                        <a href="/terms" data-link onclick={() => close()}>Terms of Service</a>
                        and <a href="/privacy" data-link onclick={() => close()}>Privacy Policy</a>.
                    </p>
                {/if}

                <button type="submit" class="btn-primary" id="auth-submit" disabled={submitting}>
                    {submitting ? submitLabel : cfg.submit}
                </button>

                {#if cfg.forgotLink}
                    <p id="auth-forgot-link" class="auth-secondary-action">
                        <button type="button" id="forgot-password-btn" class="link-btn" onclick={() => mode = 'forgot'}>
                            Forgot password?
                        </button>
                    </p>
                {/if}

                {#if cfg.resendLink}
                    <p id="auth-resend-group" class="auth-secondary-action">
                        <button type="button" id="resend-code-btn" class="link-btn" onclick={handleResend}>
                            Resend verification code
                        </button>
                    </p>
                {/if}

                {#if cfg.backLink}
                    <p id="auth-back-group" class="auth-secondary-action">
                        <button type="button" id="back-to-login-btn" class="link-btn" onclick={() => mode = 'login'}>
                            &larr; Back to login
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
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--color-text-muted);
}

.password-requirements li {
    padding: 2px 0;
}

.password-requirements li::before {
    content: '○ ';
    color: var(--color-text-muted);
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
    margin-bottom: 20px;
    border-bottom: 1px solid var(--color-border);
}

.auth-tab {
    flex: 1;
    padding: 12px 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    text-align: center;
}

.auth-tab:hover {
    color: var(--color-text);
}

.auth-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}

.auth-secondary-action {
    text-align: center;
    margin-top: 12px;
    margin-bottom: 0;
    font-size: 13px;
}

.auth-age-notice {
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: center;
    margin: 8px 0 4px;
    line-height: 1.5;
}

.auth-age-notice a {
    color: var(--color-primary);
    text-decoration: none;
}

.auth-age-notice a:hover {
    text-decoration: underline;
}
</style>
