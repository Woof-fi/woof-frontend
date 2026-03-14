<script>
    import { getMyDogs, createPost, uploadImage, searchDogParks, getFollowingDogParks, searchDogs } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { validateAndPreview, revokePreview } from '../../js/file-handler.js';
    import { showToast } from '../../js/toast-store.svelte.js';
    import { focusTrap } from '../actions/focus-trap.ts';
    import {
        modals, closeCreatePostModal as storeClose,
        openAuthModal, openCreateDogModal,
    } from '../../js/modal-store.svelte.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';
    import { bumpFeedVersion, store } from '../../js/svelte-store.svelte.js';

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

    // Park location state
    let selectedPark = $state(null);
    let parkQuery = $state('');
    let parkResults = $state([]);
    let followedParks = $state([]);
    let parkSearching = $state(false);
    let showParkSection = $state(false);
    let parkDebounceTimer = $state(null);

    // Dog tagging state
    let taggedDogs = $state([]);
    let dogQuery = $state('');
    let dogResults = $state([]);
    let dogSearching = $state(false);
    let showTagSection = $state(false);
    let dogDebounceTimer = $state(null);
    const MAX_TAGS = 10;

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
                    // Pre-select active dog for multi-dog users
                    const activeDogId = store.currentDog?.id;
                    selectedDogId = activeDogId && dogs.some(d => d.id === activeDogId) ? activeDogId : '';
                    showDogSelect = true;
                }

                loading = false;

                // Load followed parks for quick selection
                getFollowingDogParks().then(parks => { followedParks = parks; }).catch(() => {});
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
        selectedImages.forEach(img => revokePreview(img.previewUrl));
        selectedImages = [];
        selectedDogId = '';
        dogs = [];
        showDogSelect = true;
        selectedPark = null;
        parkQuery = '';
        parkResults = [];
        followedParks = [];
        taggedDogs = [];
        dogQuery = '';
        dogResults = [];
        showParkSection = false;
        showTagSection = false;
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
            const result = validateAndPreview(files[i]);
            if (result) newImages.push(result);
        }

        if (newImages.length > 0) {
            selectedImages = [...selectedImages, ...newImages];
        }

        if (files.length > remaining) {
            showToast(t('postCreate.maxImages', { max: MAX_IMAGES }), 'error');
        }
    }

    function removeImage(index) {
        revokePreview(selectedImages[index].previewUrl);
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

    function handleParkSearch(e) {
        parkQuery = e.target.value;
        clearTimeout(parkDebounceTimer);
        if (parkQuery.trim().length < 2) { parkResults = []; return; }
        parkSearching = true;
        parkDebounceTimer = setTimeout(async () => {
            try { parkResults = await searchDogParks(parkQuery.trim()); }
            catch { parkResults = []; }
            parkSearching = false;
        }, 300);
    }

    function selectPark(park) {
        selectedPark = park;
        parkQuery = '';
        parkResults = [];
    }

    function clearPark() {
        selectedPark = null;
    }

    function handleDogSearch(e) {
        dogQuery = e.target.value;
        clearTimeout(dogDebounceTimer);
        if (dogQuery.trim().length < 2) { dogResults = []; return; }
        dogSearching = true;
        dogDebounceTimer = setTimeout(async () => {
            try {
                const results = await searchDogs(dogQuery.trim());
                dogResults = results.filter(d =>
                    d.id !== selectedDogId && !taggedDogs.some(td => td.id === d.id)
                );
            } catch { dogResults = []; }
            dogSearching = false;
        }, 300);
    }

    function addDogTag(dog) {
        if (taggedDogs.length >= MAX_TAGS) {
            showToast(t('postCreate.maxTags', { max: MAX_TAGS }), 'error');
            return;
        }
        if (!taggedDogs.some(td => td.id === dog.id)) {
            taggedDogs = [...taggedDogs, dog];
        }
        dogQuery = '';
        dogResults = [];
    }

    function removeDogTag(dogId) {
        taggedDogs = taggedDogs.filter(d => d.id !== dogId);
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
            const post = await createPost(
                selectedDogId,
                imageUrls,
                caption,
                selectedPark?.id || null,
                taggedDogs.map(d => d.id)
            );
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

                <!-- Park Location (optional) -->
                <div class="form-group">
                    <button type="button" class="section-toggle" onclick={() => showParkSection = !showParkSection}>
                        <i class="fas fa-location-dot"></i>
                        {t('postCreate.parkLocationOptional')}
                        {#if selectedPark}
                            <span class="section-badge">{localName(selectedPark)}</span>
                        {/if}
                        <i class="fas {showParkSection ? 'fa-chevron-up' : 'fa-chevron-down'} toggle-arrow"></i>
                    </button>
                    {#if showParkSection}
                        <div class="section-content">
                            {#if selectedPark}
                                <div class="selected-chip">
                                    <i class="fas fa-location-dot"></i>
                                    <span>{localName(selectedPark)}</span>
                                    <button type="button" class="chip-remove" onclick={clearPark} aria-label={t('postCreate.removePark')}>
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            {:else}
                                {#if followedParks.length > 0}
                                    <div class="quick-chips">
                                        {#each followedParks.slice(0, 5) as park (park.id)}
                                            <button type="button" class="quick-chip" onclick={() => selectPark(park)}>
                                                {localName(park)}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                                <div class="search-container">
                                    <input
                                        type="text"
                                        placeholder={t('postCreate.searchPark')}
                                        value={parkQuery}
                                        oninput={handleParkSearch}
                                        class="search-input"
                                    />
                                    {#if parkSearching}
                                        <i class="fas fa-spinner fa-spin search-spinner"></i>
                                    {/if}
                                </div>
                                {#if parkResults.length > 0}
                                    <div class="search-results">
                                        {#each parkResults as park (park.id)}
                                            <button type="button" class="search-result" onclick={() => selectPark(park)}>
                                                <span class="result-name">{localName(park)}</span>
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- Tag Dogs (optional) -->
                <div class="form-group">
                    <button type="button" class="section-toggle" onclick={() => showTagSection = !showTagSection}>
                        <i class="fas fa-tag"></i>
                        {t('postCreate.tagDogsOptional')}
                        {#if taggedDogs.length > 0}
                            <span class="section-badge">{taggedDogs.length}</span>
                        {/if}
                        <i class="fas {showTagSection ? 'fa-chevron-up' : 'fa-chevron-down'} toggle-arrow"></i>
                    </button>
                    {#if showTagSection}
                        <div class="section-content">
                            {#if taggedDogs.length > 0}
                                <div class="tagged-dogs-chips">
                                    {#each taggedDogs as dog (dog.id)}
                                        <div class="selected-chip">
                                            <span>{dog.name}</span>
                                            <button type="button" class="chip-remove" onclick={() => removeDogTag(dog.id)} aria-label={t('postCreate.removeTag')}>
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                            {#if taggedDogs.length < MAX_TAGS}
                                <div class="search-container">
                                    <input
                                        type="text"
                                        placeholder={t('postCreate.searchDogs')}
                                        value={dogQuery}
                                        oninput={handleDogSearch}
                                        class="search-input"
                                    />
                                    {#if dogSearching}
                                        <i class="fas fa-spinner fa-spin search-spinner"></i>
                                    {/if}
                                </div>
                                {#if dogResults.length > 0}
                                    <div class="search-results">
                                        {#each dogResults as dog (dog.id)}
                                            <button type="button" class="search-result" onclick={() => addDogTag(dog)}>
                                                <span class="result-name">{dog.name}</span>
                                                {#if dog.breedName}
                                                    <span class="result-meta">{dog.breedName}</span>
                                                {/if}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    {/if}
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

/* Park picker + Dog tagger */
.section-toggle {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    width: 100%;
    padding: var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-sm);
    background: var(--woof-surface-primary);
    cursor: pointer;
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-600);
    transition: all var(--woof-duration-fast);
}

.section-toggle:hover {
    border-color: var(--woof-color-brand-primary);
    color: var(--woof-color-brand-primary);
}

.toggle-arrow {
    margin-left: auto;
    font-size: var(--woof-text-caption-1);
}

.section-badge {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-1);
    padding: 1px var(--woof-space-2);
    border-radius: var(--woof-radius-full);
    font-weight: var(--woof-font-weight-semibold);
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.section-content {
    margin-top: var(--woof-space-2);
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.quick-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--woof-space-1);
}

.quick-chip {
    padding: var(--woof-space-1) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    background: var(--woof-surface-primary);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-700);
    cursor: pointer;
    transition: all var(--woof-duration-fast);
}

.quick-chip:hover {
    border-color: var(--woof-color-brand-primary);
    color: var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary-alpha-05);
}

.selected-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-1) var(--woof-space-2);
    background: var(--woof-color-neutral-100);
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-700);
}

.chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: none;
    color: var(--woof-color-neutral-500);
    cursor: pointer;
    padding: 0;
    border-radius: var(--woof-radius-full);
    font-size: 10px;
}

.chip-remove:hover {
    color: var(--woof-color-neutral-900);
    background: var(--woof-color-neutral-200);
}

.search-container {
    position: relative;
}

.search-input {
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-sm);
    font-size: var(--woof-text-body);
    background: var(--woof-surface-primary);
    box-sizing: border-box;
}

.search-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
}

.search-spinner {
    position: absolute;
    right: var(--woof-space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-caption-1);
}

.search-results {
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-sm);
    max-height: 200px;
    overflow-y: auto;
}

.search-result {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-size: var(--woof-text-body);
}

.search-result:hover {
    background: var(--woof-color-neutral-50);
}

.result-name {
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-900);
}

.result-meta {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
}

.tagged-dogs-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--woof-space-1);
}
</style>
