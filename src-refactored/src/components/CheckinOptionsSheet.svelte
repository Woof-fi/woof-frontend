<script>
    import { fly, fade } from 'svelte/transition';
    import { reduceMotion } from '../../js/motion.js';
    import { modals, closeCheckinOptionsSheet } from '../../js/modal-store.svelte.js';
    import { reportContent, deleteCheckin } from '../../js/api.js';
    import { CONFIG } from '../../js/config.js';
    import { showToast } from '../../js/utils.js';
    import { bumpFeedVersion } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let data = $derived(modals.checkinOptionsSheetData);
    let checkinId = $derived(data?.checkinId ?? '');
    let parkSlug = $derived(data?.parkSlug ?? '');
    let isOwnCheckin = $derived(data?.isOwnCheckin ?? false);

    // 'options' | 'report' | 'confirm-delete'
    let view = $state('options');
    let deleting = $state(false);

    const REASON_KEYS = [
        { key: 'inappropriate_content', i18n: 'post.reasonInappropriate' },
        { key: 'spam',                  i18n: 'post.reasonSpam' },
        { key: 'harassment',            i18n: 'post.reasonHarassment' },
        { key: 'other',                 i18n: 'post.reasonOther' },
    ];

    $effect(() => {
        if (!modals.checkinOptionsSheetOpen) {
            view = 'options';
            deleting = false;
        }
    });

    function getShareUrl() {
        return `${CONFIG.BASE_URL}/dog-park/${parkSlug}`;
    }

    async function handleShare() {
        const url = getShareUrl();
        if (navigator.share) {
            try { await navigator.share({ url }); } catch { /* dismissed */ }
        } else {
            await handleCopyLink();
        }
    }

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            showToast(t('checkin.linkCopied'), 'success');
        } catch {
            showToast(t('checkin.linkCopyFailed'), 'error');
        }
        closeCheckinOptionsSheet();
    }

    async function confirmDelete() {
        deleting = true;
        try {
            await deleteCheckin(checkinId);
            showToast(t('checkin.checkinDeleted'), 'success');
            bumpFeedVersion();
            closeCheckinOptionsSheet();
        } catch {
            showToast(t('checkin.failedDeleteCheckin'), 'error');
            deleting = false;
        }
    }

    async function handleReportReason(reason) {
        try {
            await reportContent('checkin', checkinId, reason);
            showToast(t('post.reportSubmitted'), 'success');
        } catch (err) {
            showToast(
                err?.status === 409 ? t('post.alreadyReported') : t('post.failedReport'),
                err?.status === 409 ? 'info' : 'error'
            );
        }
        closeCheckinOptionsSheet();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="action-sheet-backdrop"
    transition:fade={reduceMotion({ duration: 150 })}
    onclick={closeCheckinOptionsSheet}
></div>

<div
    class="action-sheet"
    role="dialog"
    aria-modal="true"
    aria-label={t('checkin.options')}
    in:fly={reduceMotion({ y: 500, duration: 280, opacity: 1 })}
    out:fly={reduceMotion({ y: 500, duration: 200, opacity: 1 })}
>
    {#if view === 'options'}
        <div in:fade={reduceMotion({ duration: 100, delay: 60 })}>
            {#if isOwnCheckin}
                <button class="action-sheet-item destructive" onclick={() => view = 'confirm-delete'}>
                    <i class="fas fa-trash-can"></i> {t('checkin.deleteCheckin')}
                </button>
            {:else}
                <button class="action-sheet-item destructive" onclick={() => view = 'report'}>
                    <i class="fas fa-flag"></i> {t('checkin.report')}
                </button>
            {/if}
            <button class="action-sheet-item" onclick={handleShare}>
                <i class="fas fa-share-nodes"></i> {t('checkin.share')}
            </button>
            <button class="action-sheet-item" onclick={handleCopyLink}>
                <i class="fas fa-link"></i> {t('checkin.copyLink')}
            </button>
            <button class="action-sheet-item cancel" onclick={closeCheckinOptionsSheet}>{t('post.cancel')}</button>
        </div>

    {:else if view === 'report'}
        <div in:fade={reduceMotion({ duration: 100, delay: 60 })}>
            <div class="sheet-subview-header">
                <button class="sheet-back" onclick={() => view = 'options'} aria-label={t('post.back')}>
                    <i class="fas fa-arrow-left"></i>
                </button>
                <span class="sheet-subview-title">{t('post.reportTitle')}</span>
                <span class="sheet-subview-spacer"></span>
            </div>
            {#each REASON_KEYS as reason}
                <button class="action-sheet-item" onclick={() => handleReportReason(reason.key)}>
                    {t(reason.i18n)}
                </button>
            {/each}
        </div>

    {:else if view === 'confirm-delete'}
        <div class="action-sheet-delete-confirm" in:fade={reduceMotion({ duration: 120, delay: 60 })}>
            <p class="action-sheet-delete-title">{t('checkin.deleteCheckinConfirm')}</p>
            <p class="action-sheet-delete-subtitle">{t('post.cantBeUndone')}</p>
            <button
                class="action-sheet-delete-btn danger"
                disabled={deleting}
                onclick={confirmDelete}
            >
                {#if deleting}
                    <i class="fas fa-spinner fa-spin"></i> {t('post.deleting')}
                {:else}
                    {t('post.delete')}
                {/if}
            </button>
            <button
                class="action-sheet-delete-btn safe"
                disabled={deleting}
                onclick={() => view = 'options'}
            >
                {t('checkin.keepCheckin')}
            </button>
        </div>
    {/if}
</div>

<style>
@import '../../css/action-sheet.css';
</style>
