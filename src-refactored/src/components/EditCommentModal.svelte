<script>
    import { updateComment } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';
    import { modals, closeEditCommentModal as storeClose } from '../../js/modal-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let submitting = $state(false);
    let content = $state('');

    // Populate content when modal opens
    $effect(() => {
        if (modals.editCommentModalOpen && modals.editCommentData) {
            content = modals.editCommentData.content || '';
        }
    });

    // Manage body scroll + modal history
    $effect(() => {
        if (modals.editCommentModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.editCommentModalOpen) return;
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
        if (!modals.editCommentData?.commentId) return;

        submitting = true;
        try {
            const result = await updateComment(modals.editCommentData.commentId, content.trim());
            modals.editCommentData.onUpdated?.(result.comment);
            showToast(t('post.commentUpdated'), 'success');
            close();
        } catch (err) {
            console.error('Failed to update comment:', err);
            showToast(t('post.failedUpdateComment'), 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="edit-comment-modal"
    class="modal"
    style:display={modals.editCommentModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content">
        <div class="modal-header">
            <button class="modal-back" aria-label={t('common.close')} onclick={close}>
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>{t('post.editCommentTitle')}</h2>
            <button
                type="submit"
                form="edit-comment-form"
                class="modal-action"
                disabled={submitting || !content.trim()}
            >
                {submitting ? t('common.saving') : t('common.save')}
            </button>
        </div>
        <div class="modal-body">
            <form id="edit-comment-form" onsubmit={handleSubmit}>
                <div class="form-group">
                    <label for="edit-comment-content">{t('post.commentLabel')}</label>
                    <textarea
                        id="edit-comment-content"
                        rows="3"
                        maxlength="2200"
                        placeholder={t('post.commentPlaceholder')}
                        bind:value={content}
                    ></textarea>
                    <small class="char-count">{content.length} / 2200</small>
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

.char-count {
    display: block;
    text-align: right;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    margin-top: var(--woof-space-1);
}
</style>
