<script>
    import { fly, fade } from 'svelte/transition';
    import { modals, closeCommentOptionsSheet, openAuthModal, openEditCommentModal } from '../../js/modal-store.svelte.js';
    import { reportContent, deleteComment } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let data         = $derived(modals.commentOptionsSheetData);
    let commentId      = $derived(data?.commentId ?? '');
    let isOwnComment   = $derived(data?.isOwnComment ?? false);
    let onDeleted      = $derived(data?.onDeleted ?? null);
    let commentContent = $derived(data?.content ?? '');
    let onUpdated      = $derived(data?.onUpdated ?? null);

    // 'options' | 'report' | 'confirm-delete'
    let view     = $state('options');
    let deleting = $state(false);

    const REASONS = [
        { key: 'inappropriate_content', labelKey: 'post.reasonInappropriate' },
        { key: 'spam',                  labelKey: 'post.reasonSpam' },
        { key: 'harassment',            labelKey: 'post.reasonHarassment' },
        { key: 'violence',              labelKey: 'post.reasonViolence' },
        { key: 'other',                 labelKey: 'post.reasonOther' },
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
            showToast(t('post.commentDeleted'), 'success');
            onDeleted?.(commentId);
            closeCommentOptionsSheet();
        } catch {
            showToast(t('post.failedDeleteComment'), 'error');
            deleting = false;
        }
    }

    async function handleReportReason(reason) {
        try {
            await reportContent('comment', commentId, reason);
            showToast(t('post.reportSubmitted'), 'success');
        } catch (err) {
            showToast(
                err?.status === 409 ? t('post.alreadyReported') : t('post.failedReport'),
                err?.status === 409 ? 'info' : 'error'
            );
        }
        closeCommentOptionsSheet();
    }

    function handleEdit() {
        // Capture derived values before closing (close nullifies the sheet data)
        const id = commentId;
        const text = commentContent;
        const callback = onUpdated;
        closeCommentOptionsSheet();
        openEditCommentModal({
            commentId: id,
            content: text,
            onUpdated: callback,
        });
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
    aria-label={t('post.commentOptions')}
    in:fly={{ y: 500, duration: 280, opacity: 1 }}
    out:fly={{ y: 500, duration: 200, opacity: 1 }}
>
    {#if view === 'options'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            {#if isOwnComment}
                <button class="action-sheet-item" onclick={handleEdit}>
                    <i class="fas fa-pen" aria-hidden="true"></i> {t('post.editComment')}
                </button>
                <button class="action-sheet-item destructive" onclick={() => (view = 'confirm-delete')}>
                    <i class="fas fa-trash-can" aria-hidden="true"></i> {t('post.deleteComment')}
                </button>
            {:else}
                <button class="action-sheet-item destructive" onclick={handleReportClick}>
                    <i class="fas fa-flag" aria-hidden="true"></i> {t('post.reportCommentBtn')}
                </button>
            {/if}
            <button class="action-sheet-item cancel" onclick={closeCommentOptionsSheet}>{t('post.cancel')}</button>
        </div>

    {:else if view === 'report'}
        <div in:fade={{ duration: 100, delay: 60 }}>
            <div class="sheet-subview-header">
                <button class="sheet-back" onclick={() => (view = 'options')} aria-label={t('post.back')}>
                    <i class="fas fa-arrow-left"></i>
                </button>
                <span class="sheet-subview-title">{t('post.reportComment')}</span>
                <span class="sheet-subview-spacer"></span>
            </div>
            {#each REASONS as reason (reason.key)}
                <button class="action-sheet-item" onclick={() => handleReportReason(reason.key)}>
                    {t(reason.labelKey)}
                </button>
            {/each}
        </div>

    {:else if view === 'confirm-delete'}
        <div class="action-sheet-delete-confirm" in:fade={{ duration: 120, delay: 60 }}>
            <p class="action-sheet-delete-title">{t('post.deleteCommentConfirm')}</p>
            <p class="action-sheet-delete-subtitle">{t('post.cantBeUndone')}</p>
            <button
                class="action-sheet-delete-btn danger"
                disabled={deleting}
                onclick={confirmDelete}
            >
                {#if deleting}
                    <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> {t('post.deleting')}
                {:else}
                    {t('post.delete')}
                {/if}
            </button>
            <button
                class="action-sheet-delete-btn safe"
                disabled={deleting}
                onclick={() => (view = 'options')}
            >
                {t('post.keepComment')}
            </button>
        </div>
    {/if}
</div>

<style>
@import '../../css/action-sheet.css';
</style>
