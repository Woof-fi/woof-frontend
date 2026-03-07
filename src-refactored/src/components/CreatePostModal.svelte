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

    const MAX_IMAGES = 5;

    // Local visibility — controlled by async open checks
    let visible = $state(false);
    let loading = $state(false);
    let dogs = $state([]);
    let selectedDogId = $state('');
    let caption = $state('');
    let submitting = $state(false);
    let showDogSelect = $state(true);

    // Multi-image state: array of { file, previewUrl }
    let selectedImages = $state([]);

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

    /** Back button: close modal and return to Create action sheet if opened from there */
    function handleBack() {
        const onBack = modals.createPostData?.onBack;
        close();
        onBack?.();
    }

    function resetForm() {
        caption = '';
        selectedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        selectedImages = [];
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

    function addFiles(files) {
        const remaining = MAX_IMAGES - selectedImages.length;
        if (remaining <= 0) {
            showToast(t('postCreate.maxImages', { max: MAX_IMAGES }), 'error');
            return;
        }

        const newImages = [];
        for (let i = 0; i < Math.min(files.length, remaining); i++) {
            const file = files[i];
            if (!isValidFileType(file)) {
                showToast(t('postCreate.invalidFileType'), 'error');
                continue;
            }
            if (!isValidFileSize(file, 10)) {
                showToast(t('postCreate.fileTooLarge'), 'error');
                continue;
            }
            newImages.push({ file, previewUrl: URL.createObjectURL(file) });
        }

        if (newImages.length > 0) {
            selectedImages = [...selectedImages, ...newImages];
        }

        if (files.length > remaining) {
            showToast(t('postCreate.maxImages', { max: MAX_IMAGES }), 'error');
        }
    }

    function removeImage(index) {
        URL.revokeObjectURL(selectedImages[index].previewUrl);
        selectedImages = selectedImages.filter((_, i) => i !== index);
    }

    function handleCameraChange(e) {
        if (e.target.files.length > 0) addFiles(e.target.files);
        e.target.value = '';
    }

    function handleGalleryChange(e) {
        if (e.target.files.length > 0) addFiles(e.target.files);
        e.target.value = '';
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (selectedImages.length === 0) {
            showToast(t('postCreate.selectImage'), 'error');
            return;
        }

        if (showDogSelect && !selectedDogId) {
            showToast(t('postCreate.selectDogError'), 'error');
            return;
        }

        submitting = true;
        try {
            showToast(t(selectedImages.length > 1 ? 'postCreate.uploadingImages' : 'postCreate.uploadingImage'), 'info');
            // Upload all images in parallel
            const imageUrls = await Promise.all(
                selectedImages.map(img => uploadImage(img.file))
            );
            const post = await createPost(selectedDogId, imageUrls, caption);
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
            <button class="modal-back" aria-label={t('common.back')} onclick={handleBack}>
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>{t('postCreate.title')}</h2>
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
                    <label for="post-image-camera">
                        {t('postCreate.image')}
                        {#if selectedImages.length > 0}
                            <span class="image-count">{selectedImages.length}/{MAX_IMAGES}</span>
                        {/if}
                    </label>
                    <div class="image-source-buttons">
                        <button
                            type="button"
                            id="post-image-camera"
                            class="btn-secondary image-source-btn"
                            onclick={() => cameraInputEl?.click()}
                            disabled={selectedImages.length >= MAX_IMAGES}
                        >
                            <i class="fas fa-camera"></i> {t('postCreate.takePhoto')}
                        </button>
                        <button
                            type="button"
                            id="post-image-gallery"
                            class="btn-secondary image-source-btn"
                            onclick={() => galleryInputEl?.click()}
                            disabled={selectedImages.length >= MAX_IMAGES}
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
                        multiple
                        style="display:none"
                        bind:this={galleryInputEl}
                        onchange={handleGalleryChange}
                    />

                    {#if selectedImages.length > 0}
                        <div class="image-preview-grid">
                            {#each selectedImages as img, i (img.previewUrl)}
                                <div class="preview-item">
                                    <img src={img.previewUrl} alt="Preview {i + 1}" class="preview-img" />
                                    <button
                                        type="button"
                                        class="preview-remove"
                                        aria-label={t('common.remove')}
                                        onclick={() => removeImage(i)}
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                    {#if i === 0}
                                        <span class="preview-cover-badge">{t('postCreate.cover')}</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div id="image-preview" class="image-preview"></div>
                    {/if}
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
.modal-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-5);
}

.modal-header h2 {
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
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
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-3);
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
    gap: var(--woof-space-2);
    padding: var(--woof-space-3) var(--woof-space-4);
    border: 2px dashed var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-sm);
    background: var(--woof-surface-primary);
    cursor: pointer;
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-500);
    transition: all var(--woof-duration-fast);
}

.image-source-btn:hover:not(:disabled) {
    border-color: var(--woof-color-brand-primary);
    color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-alpha-05);
}

.image-source-btn:disabled {
    opacity: 0.4;
    cursor: default;
}

.image-source-btn i {
    font-size: var(--woof-text-title-3);
}

.image-count {
    font-weight: normal;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    margin-left: var(--woof-space-1);
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

/* Multi-image preview grid */
.image-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-4);
}

.preview-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: var(--woof-radius-md);
    overflow: hidden;
}

.preview-item .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: var(--woof-radius-md);
}

.preview-remove {
    position: absolute;
    top: var(--woof-space-1);
    right: var(--woof-space-1);
    width: 24px;
    height: 24px;
    border-radius: var(--woof-radius-full);
    background: rgba(0, 0, 0, 0.6);
    color: var(--woof-color-neutral-0);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    padding: 0;
    transition: background var(--woof-duration-fast);
}

.preview-remove:hover {
    background: rgba(0, 0, 0, 0.8);
}

.preview-cover-badge {
    position: absolute;
    bottom: var(--woof-space-1);
    left: var(--woof-space-1);
    background: rgba(0, 0, 0, 0.6);
    color: var(--woof-color-neutral-0);
    font-size: 10px;
    font-weight: var(--woof-font-weight-semibold);
    padding: 2px var(--woof-space-1);
    border-radius: var(--woof-radius-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
