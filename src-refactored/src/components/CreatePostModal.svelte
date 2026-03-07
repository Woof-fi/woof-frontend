<script>
    import { getMyDogs, createPost, uploadImage } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { isValidFileType, isValidFileSize } from '../../js/utils.js';
    import { showToast } from '../../js/toast-store.svelte.js';
    import { focusTrap } from '../actions/focus-trap.ts';
    import {
        modals, closeCreatePostModal as storeClose,
        openAuthModal, openCreateDogModal,
    } from '../../js/modal-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { bumpFeedVersion } from '../../js/svelte-store.svelte.js';

    // Local visibility — controlled by async open checks
    let visible = $state(false);
    let loading = $state(false);
    let dogs = $state([]);
    let selectedDogId = $state('');
    let caption = $state('');
    let previewUrl = $state(null);
    let selectedFile = $state(null);
    let submitting = $state(false);
    let showDogSelect = $state(true);

    let cameraInputEl = $state(null);
    let galleryInputEl = $state(null);

    // Watch store state — run async open checks or propagate close
    $effect(() => {
        if (modals.createPostModalOpen && !visible) {
            // Sync auth check — don't show modal if not authenticated
            if (!isAuthenticated()) {
                showToast(t('postCreate.loginRequired'), 'error');
                storeClose();
                openAuthModal();
                return;
            }

            // Show modal immediately (prevents backdrop flash)
            visible = true;
            loading = true;
            pushModalState();
            toggleBodyScroll(true);

            (async () => {
                let fetchedDogs;
                try {
                    fetchedDogs = await getMyDogs();
                } catch {
                    showToast(t('postCreate.failedLoadDogs'), 'error');
                    storeClose();
                    return;
                }

                if (fetchedDogs.length === 0) {
                    showToast(t('postCreate.addDogFirst'), 'error');
                    storeClose();
                    openCreateDogModal();
                    return;
                }

                dogs = fetchedDogs;
                if (dogs.length === 1) {
                    selectedDogId = dogs[0].id;
                    showDogSelect = false;
                } else {
                    selectedDogId = '';
                    showDogSelect = true;
                }

                loading = false;
            })();
        } else if (!modals.createPostModalOpen && visible) {
            // Store requested close (e.g. back button via closeAllModals)
            visible = false;
            loading = false;
            popModalState();
            toggleBodyScroll(false);
            resetForm();
        }
    });

    function close() {
        if (!visible) return;
        visible = false;
        storeClose();
        popModalState();
        toggleBodyScroll(false);
        resetForm();
    }

    function resetForm() {
        caption = '';
        previewUrl = null;
        selectedFile = null;
        selectedDogId = '';
        dogs = [];
        showDogSelect = true;
    }

    function handleKey(e) {
        if (e.key === 'Escape') close();
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) close();
    }

    function handleFileSelect(file) {
        if (!file) return;
        if (!isValidFileType(file)) {
            showToast(t('postCreate.invalidFileType'), 'error');
            return;
        }
        if (!isValidFileSize(file, 10)) {
            showToast(t('postCreate.fileTooLarge'), 'error');
            return;
        }
        selectedFile = file;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
    }

    function handleCameraChange(e) {
        handleFileSelect(e.target.files[0]);
    }

    function handleGalleryChange(e) {
        const file = e.target.files[0];
        if (file && cameraInputEl) {
            const dt = new DataTransfer();
            dt.items.add(file);
            cameraInputEl.files = dt.files;
        }
        handleFileSelect(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!selectedFile) {
            showToast(t('postCreate.selectImage'), 'error');
            return;
        }

        if (showDogSelect && !selectedDogId) {
            showToast(t('postCreate.selectDogError'), 'error');
            return;
        }

        submitting = true;
        try {
            showToast(t('postCreate.uploadingImage'), 'info');
            const imageUrl = await uploadImage(selectedFile);
            const post = await createPost(selectedDogId, imageUrl, caption);
            close();
            bumpFeedVersion();
            showToast(t('common.postCreated'), 'success', { label: t('common.view'), href: `/post/${post.id}` });
        } catch (err) {
            console.error('Failed to create post:', err);
            showToast(t('common.failedCreatePost'), 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="create-post-modal"
    class="modal"
    style:display={visible ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content" use:focusTrap>
        <div class="modal-header">
            <h2>{t('postCreate.title')}</h2>
            <button class="modal-close" aria-label={t('common.close')} onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            {#if loading}
                <div class="modal-loading"><i class="fas fa-spinner fa-spin"></i></div>
            {:else}
            <form id="create-post-form" novalidate onsubmit={handleSubmit}>
                {#if showDogSelect}
                    <div class="form-group">
                        <label for="post-dog-select">{t('postCreate.selectDog')}</label>
                        <select id="post-dog-select" required bind:value={selectedDogId}>
                            <option value="">{t('postCreate.chooseDog')}</option>
                            {#each dogs as dog (dog.id)}
                                <option value={dog.id}>{dog.name}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <div class="form-group">
                    <label for="post-image-camera">{t('postCreate.image')}</label>
                    <div class="image-source-buttons">
                        <button
                            type="button"
                            id="post-image-camera"
                            class="btn-secondary image-source-btn"
                            onclick={() => cameraInputEl?.click()}
                        >
                            <i class="fas fa-camera"></i> {t('postCreate.takePhoto')}
                        </button>
                        <button
                            type="button"
                            id="post-image-gallery"
                            class="btn-secondary image-source-btn"
                            onclick={() => galleryInputEl?.click()}
                        >
                            <i class="fas fa-images"></i> {t('postCreate.gallery')}
                        </button>
                    </div>
                    <input
                        type="file"
                        id="post-image"
                        accept="image/*"
                        capture="environment"
                        style="display:none"
                        bind:this={cameraInputEl}
                        onchange={handleCameraChange}
                    />
                    <input
                        type="file"
                        id="post-image-gallery-input"
                        accept="image/*"
                        style="display:none"
                        bind:this={galleryInputEl}
                        onchange={handleGalleryChange}
                    />
                    <div id="image-preview" class="image-preview">
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt="Post preview"
                                class="preview-img"
                            />
                        {/if}
                    </div>
                </div>

                <div class="form-group">
                    <label for="post-caption">{t('postCreate.captionOptional')}</label>
                    <textarea
                        id="post-caption"
                        rows="3"
                        maxlength="500"
                        bind:value={caption}
                    ></textarea>
                </div>

                <button type="submit" class="btn-primary" disabled={submitting}>
                    {submitting ? t('postCreate.posting') : t('postCreate.post')}
                </button>
            </form>
            {/if}
        </div>
    </div>
</div>

<style>
.modal-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--woof-space-8) 0;
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-title-2);
}

#create-post-form {
    display: flex;
    flex-direction: column;
}

.image-source-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

#post-image-camera {
    display: none;
}

@media (max-width: 768px) {
    #post-image-camera {
        display: flex;
    }
}

.image-source-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: all 0.2s;
}

.image-source-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--woof-color-brand-primary-alpha-05);
}

.image-source-btn i {
    font-size: 18px;
}

.image-preview {
    margin-bottom: var(--woof-space-4);
    max-height: 400px;
    overflow: hidden;
    border-radius: var(--woof-radius-md);
    background-color: var(--woof-color-neutral-900);
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-img {
    max-width: 100%;
    max-height: 300px;
    border-radius: var(--woof-radius-md);
    margin-top: var(--woof-space-2);
    object-fit: contain;
    display: block;
}
</style>
