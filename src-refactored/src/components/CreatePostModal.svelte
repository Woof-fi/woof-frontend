<script>
    import { getMyDogs, createPost, uploadImage } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';

    let visible = $state(false);
    let dogs = $state([]);
    let selectedDogId = $state('');
    let caption = $state('');
    let previewUrl = $state(null);
    let selectedFile = $state(null);
    let submitting = $state(false);
    let showDogSelect = $state(true);

    let cameraInputEl = $state(null);
    let galleryInputEl = $state(null);

    async function open() {
        if (!isAuthenticated()) {
            showToast('Please login to create a post', 'error');
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        try {
            dogs = await getMyDogs();
        } catch {
            showToast('Failed to load your dogs', 'error');
            return;
        }

        if (dogs.length === 0) {
            showToast('Please add a dog first', 'error');
            window.dispatchEvent(new CustomEvent('openCreateDogModal'));
            return;
        }

        if (dogs.length === 1) {
            selectedDogId = dogs[0].id;
            showDogSelect = false;
        } else {
            selectedDogId = '';
            showDogSelect = true;
        }

        visible = true;
        pushModalState();
        toggleBodyScroll(true);
    }

    function close() {
        if (!visible) return;
        visible = false;
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

    $effect(() => {
        function handleOpen() { open(); }
        function handleCloseAll() { if (visible) close(); }

        window.addEventListener('openCreatePostModal', handleOpen);
        window.addEventListener('open-create-post-modal', handleOpen);
        window.addEventListener('close-all-modals', handleCloseAll);

        return () => {
            window.removeEventListener('openCreatePostModal', handleOpen);
            window.removeEventListener('open-create-post-modal', handleOpen);
            window.removeEventListener('close-all-modals', handleCloseAll);
        };
    });

    function handleFileSelect(file) {
        if (!file) return;
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
            showToast('Please select an image', 'error');
            return;
        }

        if (showDogSelect && !selectedDogId) {
            showToast('Please select a dog', 'error');
            return;
        }

        submitting = true;
        try {
            showToast('Uploading image...', 'info');
            const imageUrl = await uploadImage(selectedFile);
            const post = await createPost(selectedDogId, imageUrl, caption);
            close();
            window.dispatchEvent(new CustomEvent('feed-refresh', { detail: post }));
        } catch (err) {
            console.error('Failed to create post:', err);
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
    role="dialog"
    aria-modal="true"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create Post</h2>
            <button class="modal-close" aria-label="Close" onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            <form id="create-post-form" novalidate onsubmit={handleSubmit}>
                {#if showDogSelect}
                    <div class="form-group">
                        <label for="post-dog-select">Select Dog</label>
                        <select id="post-dog-select" required bind:value={selectedDogId}>
                            <option value="">Choose a dog...</option>
                            {#each dogs as dog (dog.id)}
                                <option value={dog.id}>{dog.name}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <div class="form-group">
                    <label>Image</label>
                    <div class="image-source-buttons">
                        <button
                            type="button"
                            id="post-image-camera"
                            class="btn-secondary image-source-btn"
                            onclick={() => cameraInputEl?.click()}
                        >
                            <i class="fas fa-camera"></i> Take Photo
                        </button>
                        <button
                            type="button"
                            id="post-image-gallery"
                            class="btn-secondary image-source-btn"
                            onclick={() => galleryInputEl?.click()}
                        >
                            <i class="fas fa-images"></i> Gallery
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
                                alt="Image preview"
                                style="max-width:100%;max-height:300px;border-radius:8px;margin-top:10px;"
                            />
                        {/if}
                    </div>
                </div>

                <div class="form-group">
                    <label for="post-caption">Caption (optional)</label>
                    <textarea
                        id="post-caption"
                        rows="3"
                        maxlength="500"
                        bind:value={caption}
                    ></textarea>
                </div>

                <button type="submit" class="btn-primary" disabled={submitting}>
                    {submitting ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    </div>
</div>
