<script>
    import { showToast } from '../../js/utils.js';
    import { t } from '../../js/i18n-store.svelte.js';

    async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve(success);
        } catch {
            document.body.removeChild(textarea);
            return Promise.resolve(false);
        }
    }

    let btnText = $derived.by(() => btnTextOverride || t('invite.share'));
    let btnTextOverride = $state('');
    let btnIcon = $state('fas fa-share-alt');

    async function handleShare() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('invite.shareTitle'),
                    text: t('invite.shareText'),
                    url: window.location.origin
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    await doClipboardFallback();
                }
            }
        } else {
            await doClipboardFallback();
        }
    }

    async function doClipboardFallback() {
        const success = await copyToClipboard(window.location.origin);
        if (success) {
            showToast(t('invite.linkCopied'), 'success');
            btnIcon = 'fas fa-check';
            btnTextOverride = t('invite.copied');
            setTimeout(() => {
                btnIcon = 'fas fa-share-alt';
                btnTextOverride = '';
            }, 2000);
        } else {
            showToast(t('invite.failedCopy'), 'error');
        }
    }
</script>

<div class="invite-card">
    <div class="invite-card-icon">
        <i class="fas fa-envelope-open-text"></i>
    </div>
    <h3 class="invite-card-heading">{t('invite.heading')}</h3>
    <p class="invite-card-desc">{t('invite.desc')}</p>
    <div class="invite-card-actions">
        <button class="btn-primary invite-card-btn" onclick={handleShare}>
            <i class={btnIcon}></i> {btnText}
        </button>
    </div>
</div>

<style>
.invite-card {
    background: linear-gradient(135deg, var(--woof-color-brand-primary-subtle) 0%, var(--woof-color-neutral-50) 100%);
    border: 1px solid rgba(239, 70, 33, 0.12);
    border-left: 4px solid var(--color-primary);
    margin-bottom: 20px;
    border-radius: var(--woof-radius-md);
    padding: 24px;
    text-align: center;
}

.invite-card-icon {
    font-size: 28px;
    color: var(--color-primary);
    margin-bottom: 8px;
}

.invite-card-heading {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 6px;
}

.invite-card-desc {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0 0 16px;
}

.invite-card-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
}

.invite-card-btn {
    padding: 8px 16px;
    font-size: 13px;
}
</style>
