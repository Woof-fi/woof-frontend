<script>
    import { updateDog, uploadImage } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/utils.js';

    let visible = $state(false);
    let submitting = $state(false);

    // Current dog data
    let dogId = $state('');
    let dogName = $state('');
    let breed = $state('');
    let age = $state('');
    let location = $state('');
    let bio = $state('');
    let photoFile = $state(null);
    let currentPhotoUrl = $state(null);
    let previewUrl = $state(null);

    let photoInputEl = $state(null);

    function open(dog) {
        dogId = dog.id;
        dogName = dog.name || '';
        breed = dog.breed || '';
        age = dog.age ?? '';
        location = dog.location || '';
        bio = dog.bio || '';
        photoFile = null;
        currentPhotoUrl = dog.profilePhoto || null;
        previewUrl = null;

        visible = true;
        pushModalState();
        toggleBodyScroll(true);
    }

    function close() {
        if (!visible) return;
        visible = false;
        popModalState();
        toggleBodyScroll(false);
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
        function handleOpen(e) {
            const dog = e.detail;
            if (dog) open(dog);
        }
        function handleCloseAll() { if (visible) close(); }

        window.addEventListener('openEditDogModal', handleOpen);
        window.addEventListener('close-all-modals', handleCloseAll);

        return () => {
            window.removeEventListener('openEditDogModal', handleOpen);
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
        submitting = true;

        try {
            let profile_photo = undefined;
            if (photoFile) {
                showToast('Uploading photo...', 'info');
                profile_photo = await uploadImage(photoFile);
            }

            const dogData = {
                name: dogName.trim(),
                breed: breed.trim(),
                age: parseInt(age),
                location: location.trim(),
                bio: bio.trim(),
                ...(profile_photo && { profile_photo }),
            };

            await updateDog(dogId, dogData);
            showToast('Profile updated!', 'success');
            close();
            window.dispatchEvent(new CustomEvent('profile-refresh'));
        } catch (err) {
            console.error('Failed to update dog:', err);
            showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="edit-dog-modal"
    class="modal"
    style:display={visible ? 'block' : 'none'}
    onclick={handleOverlayClick}
    role="dialog"
    aria-modal="true"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Edit Profile</h2>
            <button class="modal-close" aria-label="Close" onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            <form id="edit-dog-form" onsubmit={handleSubmit}>
                <input type="hidden" id="edit-dog-id" value={dogId} />
                <div class="form-group">
                    <label for="edit-dog-name">Name *</label>
                    <input
                        type="text"
                        id="edit-dog-name"
                        required
                        maxlength="50"
                        bind:value={dogName}
                    />
                </div>
                <div class="form-group">
                    <label for="edit-dog-breed">Breed *</label>
                    <input
                        type="text"
                        id="edit-dog-breed"
                        required
                        maxlength="50"
                        bind:value={breed}
                    />
                </div>
                <div class="form-group">
                    <label for="edit-dog-age">Age *</label>
                    <input
                        type="number"
                        id="edit-dog-age"
                        required
                        min="0"
                        max="30"
                        step="1"
                        bind:value={age}
                    />
                </div>
                <div class="form-group">
                    <label for="edit-dog-location">Location</label>
                    <input
                        type="text"
                        id="edit-dog-location"
                        maxlength="100"
                        placeholder="e.g., Helsinki, Finland"
                        bind:value={location}
                    />
                </div>
                <div class="form-group">
                    <label for="edit-dog-bio">Bio</label>
                    <textarea
                        id="edit-dog-bio"
                        rows="3"
                        maxlength="500"
                        placeholder="Tell us about your dog..."
                        bind:value={bio}
                    ></textarea>
                </div>
                <div class="form-group">
                    <label for="edit-dog-photo">Change Profile Photo</label>
                    <input
                        type="file"
                        id="edit-dog-photo"
                        accept="image/*"
                        bind:this={photoInputEl}
                        onchange={handlePhotoChange}
                    />
                    <div id="edit-dog-photo-preview" class="image-preview">
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style="max-width:200px;max-height:200px;border-radius:8px;"
                            />
                        {:else if currentPhotoUrl}
                            <img
                                src={currentPhotoUrl}
                                alt="Current photo"
                                style="max-width:200px;max-height:200px;border-radius:8px;"
                            />
                        {/if}
                    </div>
                </div>
                <button type="submit" class="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    </div>
</div>
