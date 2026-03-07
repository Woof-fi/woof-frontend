<script>
    import { updatePost } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';
    import { modals, closeEditPostModal as storeClose } from '../../js/modal-store.svelte.js';
    import { bumpFeedVersion } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let submitting = $state(false);
    let caption = $state('');

    // Populate caption when modal opens
    $effect(() => {
        if (modals.editPostModalOpen && modals.editPostData) {
            caption = modals.editPostData.caption || '';
        }
    });

    // Manage body scroll + modal history
    $effect(() => {
        if (modals.editPostModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.editPostModalOpen) return;
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
        if (!modals.editPostData?.id) return;

        submitting = true;
        try {
            await updatePost(modals.editPostData.id, caption.trim());
            close();
            bumpFeedVersion();
        } catch (err) {
            console.error('Failed to update post:', err);
            showToast(t('common.error'), 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="edit-post-modal"
    class="modal"
    style:display={modals.editPostModalOpen ? 'block' : 'none'}
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
            <h2>{t('postEdit.title')}</h2>
            <button
                type="submit"
                form="edit-post-form"
                class="modal-action"
                disabled={submitting}
            >
                {submitting ? t('postEdit.saving') : t('postEdit.save')}
            </button>
        </div>
        <div class="modal-body">
            <form id="edit-post-form" onsubmit={handleSubmit}>
                <div class="form-group">
                    <label for="edit-post-caption">{t('postEdit.caption')}</label>
                    <textarea
                        id="edit-post-caption"
                        rows="4"
                        maxlength="2200"
                        placeholder={t('postEdit.placeholder')}
                        bind:value={caption}
                    ></textarea>
                    <small class="char-count">{caption.length} / 2200</small>
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
