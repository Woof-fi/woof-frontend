<script>
    import { fly, fade } from 'svelte/transition';
    import { modals, closeCommentOptionsSheet, openAuthModal } from '../../js/modal-store.svelte.js';
    import { reportContent, deleteComment } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';

    let data         = $derived(modals.commentOptionsSheetData);
    let commentId    = $derived(data?.commentId ?? '');
    let isOwnComment = $derived(data?.isOwnComment ?? false);
    let onDeleted    = $derived(data?.onDeleted ?? null);

    // 'options' | 'report' | 'confirm-delete'
    let view     = $state('options');
    let deleting = $state(false);

    const REASONS = [
        { key: 'inappropriate_content', label: 'Inappropriate content' },
        { key: 'spam',                  label: 'Spam' },
        { key: 'harassment',            label: 'Harassment' },
        { key: 'violence',              label: 'Violence' },
        { key: 'other',                 label: 'Other' },
    ];

    // Reset view state when sheet closes
    $effect(() => {
        if (!modals.commentOptionsSheetOpen) {
            view = 'options';
            deleting = false;
        }
    });

    async function confirmDelete() {
        if (!commentId) return;
        deleting = true;
        try {
            await deleteComment(commentId);
            showToast('Comment deleted', 'success');
            onDeleted?.(commentId);
            closeCommentOptionsSheet();
        } catch {
            showToast('Failed to delete comment', 'error');
            deleting = false;
        }
    }

    async function handleReportReason(reason) {
        try {
            await reportContent('comment', commentId, reason);
            showToast('Report submitted. Thank you!', 'success');
        } catch (err) {
            showToast(
                err?.status === 409 ? 'Already reported' : 'Failed to submit report',
                err?.status === 409 ? 'info' : 'error'
            );
        }
        closeCommentOptionsSheet();
    }

    function handleReportClick() {
        if (!isAuthenticated()) {
            closeCommentOptionsSheet();
            openAuthModal();
            return;
        }
        view = 'report';
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="action-sheet-backdrop"
    transition:fade={{ duration: 150 }}
    onclick={closeCommentOptionsSheet}
></div>

<div
    class="action-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="Comment options"
    in:fly={{ y: 500, duration: 280, opacity: 1 }}
    out:fly={{ y: 500, duration: 200, opacity: 1 }}
>
    {#if view === 'options'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            {#if isOwnComment}
                <button class="action-sheet-item destructive" onclick={() => (view = 'confirm-delete')}>
                    <i class="fas fa-trash-alt" aria-hidden="true"></i> Delete comment
                </button>
            {:else}
                <button class="action-sheet-item destructive" onclick={handleReportClick}>
                    <i class="fas fa-flag" aria-hidden="true"></i> Report comment
                </button>
            {/if}
            <button class="action-sheet-item cancel" onclick={closeCommentOptionsSheet}>Cancel</button>
        </div>

    {:else if view === 'report'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            <div class="action-sheet-title">Why are you reporting this comment?</div>
            {#each REASONS as reason (reason.key)}
                <button class="action-sheet-item" onclick={() => handleReportReason(reason.key)}>
                    {reason.label}
                </button>
            {/each}
            <button class="action-sheet-item cancel" onclick={() => (view = 'options')}>← Back</button>
        </div>

    {:else if view === 'confirm-delete'}
        <div class="action-sheet-delete-confirm" in:fade={{ duration: 120, delay: 60 }}>
            <p class="action-sheet-delete-title">Delete this comment?</p>
            <p class="action-sheet-delete-subtitle">This can't be undone.</p>
            <button
                class="action-sheet-delete-btn danger"
                disabled={deleting}
                onclick={confirmDelete}
            >
                {#if deleting}
                    <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Deleting…
                {:else}
                    Delete
                {/if}
            </button>
            <button
                class="action-sheet-delete-btn safe"
                disabled={deleting}
                onclick={() => (view = 'options')}
            >
                Keep comment
            </button>
        </div>
    {/if}
</div>
