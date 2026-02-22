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

    let visible = $state(false);
    let mode = $state('login'); // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
    let pendingEmail = $state('');

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

    function open(tab = null) {
        visible = true;
        if (tab) mode = tab;
        pushModalState();
        toggleBodyScroll(true);
    }

    function close() {
        if (!visible) return;
        visible = false;
        popModalState();
        toggleBodyScroll(false);
        // Reset form
        email = '';
        password = '';
        name = '';
        verifyCode = '';
        newPassword = '';
        pendingEmail = '';
    }

    function handleKey(e) {
        if (e.key === 'Escape') close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    $effect(() => {
        function handleOpen(e) {
            const tab = e.detail?.tab || null;
            open(tab);
        }
        function handleCloseAll() {
            if (visible) close();
        }

        window.addEventListener('open-auth-modal', handleOpen);
        window.addEventListener('close-all-modals', handleCloseAll);

        return () => {
            window.removeEventListener('open-auth-modal', handleOpen);
            window.removeEventListener('close-all-modals', handleCloseAll);
        };
    });

    async function handleSubmit(e) {
        e.preventDefault();
        submitting = true;
        const origLabel = cfg.submit;

        try {
            switch (mode) {
                case 'login': {
                    submitLabel = 'Logging in...';
                    await login(email, password);
                    close();
                    email = '';
                    password = '';
                    window.dispatchEvent(new CustomEvent('auth-state-changed'));
                    break;
                }
                case 'register': {
                    submitLabel = 'Registering...';
                    await register(email, password, name);
                    pendingEmail = email;
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
                    mode = 'login';
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
    style:display={visible ? 'block' : 'none'}
    onclick={handleOverlayClick}
    role="dialog"
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
                        <input type="text" id="auth-name" bind:value={name} />
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

                <button type="submit" class="btn-primary" id="auth-submit" disabled={submitting}>
                    {submitting ? submitLabel : cfg.submit}
                </button>

                {#if cfg.forgotLink}
                    <p id="auth-forgot-link" class="auth-secondary-action">
                        <a href="#" id="forgot-password-btn" onclick={(e) => { e.preventDefault(); mode = 'forgot'; }}>
                            Forgot password?
                        </a>
                    </p>
                {/if}

                {#if cfg.resendLink}
                    <p id="auth-resend-group" class="auth-secondary-action">
                        <a href="#" id="resend-code-btn" onclick={handleResend}>
                            Resend verification code
                        </a>
                    </p>
                {/if}

                {#if cfg.backLink}
                    <p id="auth-back-group" class="auth-secondary-action">
                        <a href="#" id="back-to-login-btn" onclick={(e) => { e.preventDefault(); mode = 'login'; }}>
                            &larr; Back to login
                        </a>
                    </p>
                {/if}
            </form>
        </div>
    </div>
</div>
