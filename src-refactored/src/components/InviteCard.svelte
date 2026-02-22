<script>
    import { showToast } from '../../js/utils.js';

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

    let btnText = $state('Share');
    let btnIcon = $state('fas fa-share-alt');

    async function handleShare() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Woof!',
                    text: 'Come join the social network for dogs!',
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
            showToast('Link copied!', 'success');
            btnIcon = 'fas fa-check';
            btnText = 'Copied!';
            setTimeout(() => {
                btnIcon = 'fas fa-share-alt';
                btnText = 'Share';
            }, 2000);
        } else {
            showToast('Failed to copy link', 'error');
        }
    }
</script>

<div class="invite-card">
    <div class="invite-card-icon">
        <i class="fas fa-envelope-open-text"></i>
    </div>
    <h3 class="invite-card-heading">Know a good boy or girl?</h3>
    <p class="invite-card-desc">Invite your friends and their dogs to join the pack!</p>
    <div class="invite-card-actions">
        <button class="btn-primary invite-card-btn" onclick={handleShare}>
            <i class={btnIcon}></i> {btnText}
        </button>
    </div>
</div>
