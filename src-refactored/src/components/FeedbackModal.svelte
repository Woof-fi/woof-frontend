<script>
    import { submitFeedback } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { modals, closeFeedbackModal as storeClose } from '../../js/modal-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { showToast } from '../../js/utils.js';
    import { focusTrap } from '../actions/focus-trap.ts';

    let category = $state('general');
    let message = $state('');
    let submitting = $state(false);

    const MAX_LENGTH = 2000;
    let charCount = $derived(message.length);
    let canSubmit = $derived(message.trim().length > 0 && charCount <= MAX_LENGTH && !submitting);

    // Reset form when modal opens
    $effect(() => {
        if (modals.feedbackModalOpen) {
            category = 'general';
            message = '';
        }
    });

    // Manage body scroll + modal history
    $effect(() => {
        if (modals.feedbackModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.feedbackModalOpen) return;
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
        if (!canSubmit) return;

        submitting = true;
        try {
            await submitFeedback(category, message.trim());
            showToast(t('feedback.sent'), 'success');
            close();
        } catch {
            showToast(t('feedback.failed'), 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="feedback-modal"
    class="modal"
    style:display={modals.feedbackModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content" use:focusTrap>
        <div class="modal-header">
            <button class="modal-back" aria-label={t('common.close')} onclick={close}>
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>{t('feedback.title')}</h2>
            <button
                type="submit"
                form="feedback-form"
                class="modal-action"
                disabled={!canSubmit}
            >
                {submitting ? t('feedback.sending') : t('feedback.submit')}
            </button>
        </div>

        <div class="modal-body">
            <p class="feedback-description">{t('feedback.description')}</p>

            <form id="feedback-form" onsubmit={handleSubmit}>
                <!-- Category pills -->
                <div class="category-pills" role="radiogroup" aria-label={t('feedback.title')}>
                    {#each ['bug', 'feature', 'general'] as cat (cat)}
                        <button
                            type="button"
                            class="category-pill"
                            class:active={category === cat}
                            onclick={() => category = cat}
                            role="radio"
                            aria-checked={category === cat}
                        >
                            <i class="fas {cat === 'bug' ? 'fa-bug' : cat === 'feature' ? 'fa-lightbulb' : 'fa-comment'}" aria-hidden="true"></i>
                            {t(`feedback.category_${cat}`)}
                        </button>
                    {/each}
                </div>

                <!-- Message textarea -->
                <div class="feedback-field">
                    <textarea
                        bind:value={message}
                        placeholder={t('feedback.placeholder')}
                        maxlength={MAX_LENGTH}
                        rows="5"
                    ></textarea>
                    <span class="char-count" class:warn={charCount > MAX_LENGTH * 0.9}>
                        {t('feedback.charCount', { current: charCount, max: MAX_LENGTH })}
                    </span>
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
    margin-bottom: var(--woof-space-4);
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

.feedback-description {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0 0 var(--woof-space-4);
    line-height: var(--woof-line-height-body);
}

.category-pills {
    display: flex;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-4);
    flex-wrap: wrap;
}

.category-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-600);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
    font-family: inherit;
    cursor: pointer;
    transition: all var(--woof-duration-fast);
}

.category-pill:hover {
    border-color: var(--woof-color-neutral-300);
    background: var(--woof-color-neutral-50);
}

.category-pill.active {
    border-color: var(--woof-color-brand-primary);
    background: color-mix(in srgb, var(--woof-color-brand-primary) 8%, transparent);
    color: var(--woof-color-brand-primary);
}

.feedback-field {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
}

.feedback-field textarea {
    width: 100%;
    padding: var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-callout);
    font-family: inherit;
    background: var(--woof-color-neutral-50);
    color: var(--woof-color-neutral-900);
    resize: vertical;
    min-height: 120px;
    transition: border-color var(--woof-duration-fast);
    box-sizing: border-box;
    line-height: var(--woof-line-height-body);
}

.feedback-field textarea:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    background: var(--woof-surface-primary);
}

.char-count {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-400);
    text-align: right;
}

.char-count.warn {
    color: var(--woof-color-warning);
}

@media (max-width: 768px) {
    .feedback-field textarea {
        font-size: 16px;
    }
}
</style>
