<script>
    import { updateDog, uploadImage } from '../../js/api.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast, isValidFileType, isValidFileSize } from '../../js/utils.js';
    import { modals, closeEditDogModal as storeClose } from '../../js/modal-store.svelte.js';
    import { bumpProfileVersion } from '../../js/svelte-store.svelte.js';
    import BreedAutocomplete from './BreedAutocomplete.svelte';
    import TerritoryAutocomplete from './TerritoryAutocomplete.svelte';

    let submitting = $state(false);

    // Form fields — populated reactively from modals.editDogData
    let dogId = $state('');
    let dogName = $state('');
    let breedId = $state('');
    let breedName = $state('');
    let age = $state('');
    let territoryId = $state('');
    let territoryName = $state('');
    let bio = $state('');
    let photoFile = $state(null);
    let currentPhotoUrl = $state(null);
    let previewUrl = $state(null);

    let photoInputEl = $state(null);

    // Build territory display name from type + parent chain
    function buildTerritoryDisplayName(data) {
        if (!data.territoryName) return '';
        if (data.territoryType === 'sub_district' && data.territoryParentName && data.territoryGrandparentName) {
            return `${data.territoryName}, ${data.territoryParentName}, ${data.territoryGrandparentName}`;
        }
        if (data.territoryType === 'district' && data.territoryParentName) {
            return `${data.territoryName}, ${data.territoryParentName}`;
        }
        return data.territoryName;
    }

    // Populate form fields when modal opens with dog data
    $effect(() => {
        if (modals.editDogModalOpen && modals.editDogData) {
            dogId = modals.editDogData.id;
            dogName = modals.editDogData.name || '';
            breedId = modals.editDogData.breedId || '';
            breedName = modals.editDogData.breedName || '';
            age = modals.editDogData.age ?? '';
            territoryId = modals.editDogData.territoryId || '';
            territoryName = buildTerritoryDisplayName(modals.editDogData);
            bio = modals.editDogData.bio || '';
            photoFile = null;
            currentPhotoUrl = modals.editDogData.profilePhoto || null;
            previewUrl = null;
        }
    });

    // Manage body scroll + modal history based on store state
    $effect(() => {
        if (modals.editDogModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.editDogModalOpen) return;
        storeClose();
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

    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = null;
            photoFile = null;
            return;
        }
        if (!isValidFileType(file)) {
            showToast('Only JPEG, PNG, GIF and WebP images are allowed', 'error');
            e.target.value = '';
            return;
        }
        if (!isValidFileSize(file, 10)) {
            showToast('Image must be under 10 MB', 'error');
            e.target.value = '';
            return;
        }
        photoFile = file;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!breedId) {
            showToast('Please select a breed from the list', 'error');
            return;
        }

        submitting = true;

        try {
            let profile_photo = undefined;
            if (photoFile) {
                showToast('Uploading photo...', 'info');
                profile_photo = await uploadImage(photoFile);
            }

            const dogData = {
                name: dogName.trim(),
                breed_id: breedId,
                age: parseInt(age),
                bio: bio.trim(),
                ...(profile_photo && { profile_photo }),
                territory_id: territoryId || null,
            };

            await updateDog(dogId, dogData);
            showToast('Profile updated!', 'success');
            close();
            bumpProfileVersion();
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
    style:display={modals.editDogModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
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
                    <BreedAutocomplete
                        id="edit-dog-breed"
                        required={true}
                        bind:selectedBreedId={breedId}
                        bind:selectedBreedName={breedName}
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
                    <label for="edit-dog-territory">Territory / Reviiri</label>
                    <TerritoryAutocomplete
                        id="edit-dog-territory"
                        bind:selectedTerritoryId={territoryId}
                        bind:selectedTerritoryName={territoryName}
                    />
                    <small class="form-hint">Set your territory to connect with nearby dogs</small>
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
                                alt="Current profile"
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
