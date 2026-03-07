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
    let btnIcon = $state('fas fa-share-nodes');

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
                btnIcon = 'fas fa-share-nodes';
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
    border: 1px solid var(--woof-color-brand-primary-alpha-12);
    border-left: var(--woof-space-1) solid var(--woof-color-brand-primary);
    margin-bottom: var(--woof-space-5);
    border-radius: var(--woof-radius-md);
    padding: var(--woof-space-6);
    text-align: center;
}

.invite-card-icon {
    font-size: var(--woof-text-title-1);
    color: var(--woof-color-brand-primary);
    margin-bottom: var(--woof-space-2);
}

.invite-card-heading {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 var(--woof-space-2);
}

.invite-card-desc {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-400);
    margin: 0 0 var(--woof-space-4);
}

.invite-card-actions {
    display: flex;
    gap: var(--woof-space-2);
    justify-content: center;
    flex-wrap: wrap;
}

.invite-card-btn {
    padding: var(--woof-space-2) var(--woof-space-4);
    font-size: var(--woof-text-footnote);
}
</style>
