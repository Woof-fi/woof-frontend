<script>
    import { updatePost } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';
    import { modals, closeEditPostModal as storeClose } from '../../js/modal-store.svelte.js';
    import { bumpFeedVersion } from '../../js/svelte-store.svelte.js';

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
            <h2>Edit Caption</h2>
            <button class="modal-close" aria-label="Close" onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            <form id="edit-post-form" onsubmit={handleSubmit}>
                <div class="form-group">
                    <label for="edit-post-caption">Caption</label>
                    <textarea
                        id="edit-post-caption"
                        rows="4"
                        maxlength="2200"
                        placeholder="Write a caption..."
                        bind:value={caption}
                    ></textarea>
                    <small class="char-count">{caption.length} / 2200</small>
                </div>
                <button type="submit" class="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                </button>
            </form>
        </div>
    </div>
</div>

<style>
.char-count {
    display: block;
    text-align: right;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    margin-top: var(--woof-space-1);
}
</style>
