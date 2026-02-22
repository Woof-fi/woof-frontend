<script>
    import { createDog, uploadImage } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';

    let visible = $state(false);
    let submitting = $state(false);

    // Form fields
    let dogName = $state('');
    let breed = $state('');
    let age = $state('');
    let location = $state('');
    let bio = $state('');
    let photoFile = $state(null);
    let previewUrl = $state(null);

    let photoInputEl = $state(null);

    function open() {
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
        dogName = '';
        breed = '';
        age = '';
        location = '';
        bio = '';
        photoFile = null;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
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

        window.addEventListener('openCreateDogModal', handleOpen);
        window.addEventListener('open-create-dog-modal', handleOpen);
        window.addEventListener('close-all-modals', handleCloseAll);

        return () => {
            window.removeEventListener('openCreateDogModal', handleOpen);
            window.removeEventListener('open-create-dog-modal', handleOpen);
            window.removeEventListener('close-all-modals', handleCloseAll);
        };
    });

    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = null;
            photoFile = null;
            return;
        }
        photoFile = file;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!isAuthenticated()) {
            showToast('Please login to add a pet', 'error');
            close();
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        if (!photoFile) {
            showToast('Please add a profile photo for your dog', 'error');
            return;
        }

        submitting = true;
        try {
            showToast('Uploading photo...', 'info');
            const profilePhoto = await uploadImage(photoFile);

            const dogData = {
                name: dogName.trim(),
                breed: breed.trim(),
                age: parseInt(age),
                profile_photo: profilePhoto,
                ...(location.trim() && { location: location.trim() }),
                ...(bio.trim() && { bio: bio.trim() }),
            };

            const createdDog = await createDog(dogData);
            close();

            window.dispatchEvent(new CustomEvent('auth-state-changed'));

            if (createdDog && createdDog.slug) {
                history.pushState({}, '', `/dog/${createdDog.slug}`);
                window.dispatchEvent(new CustomEvent('routechange'));
            }
        } catch (err) {
            console.error('Failed to create dog:', err);
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="create-dog-modal"
    class="modal"
    style:display={visible ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Add a Pet</h2>
            <button class="modal-close" aria-label="Close" onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            <form id="create-dog-form" onsubmit={handleSubmit}>
                <div class="form-group">
                    <label for="dog-name">Name *</label>
                    <input
                        type="text"
                        id="dog-name"
                        required
                        maxlength="50"
                        placeholder="e.g., Nelli"
                        bind:value={dogName}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-breed">Breed *</label>
                    <input
                        type="text"
                        id="dog-breed"
                        required
                        maxlength="50"
                        placeholder="e.g., Finnish Lapphund"
                        bind:value={breed}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-age">Age *</label>
                    <input
                        type="number"
                        id="dog-age"
                        required
                        min="0"
                        max="30"
                        step="1"
                        bind:value={age}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-location">Location (optional)</label>
                    <input
                        type="text"
                        id="dog-location"
                        maxlength="100"
                        placeholder="e.g., Helsinki, Finland"
                        bind:value={location}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-bio">Bio (optional)</label>
                    <textarea
                        id="dog-bio"
                        rows="3"
                        maxlength="500"
                        placeholder="Tell us about your dog..."
                        bind:value={bio}
                    ></textarea>
                </div>
                <div class="form-group">
                    <label for="dog-photo">Profile Photo *</label>
                    <input
                        type="file"
                        id="dog-photo"
                        accept="image/*"
                        required
                        bind:this={photoInputEl}
                        onchange={handlePhotoChange}
                    />
                    <small class="form-hint">Square photos work best</small>
                    <div id="dog-photo-preview" class="image-preview">
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style="max-width:200px;max-height:200px;border-radius:8px;"
                            />
                        {/if}
                    </div>
                </div>
                <button type="submit" class="btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Pet'}
                </button>
            </form>
        </div>
    </div>
</div>
