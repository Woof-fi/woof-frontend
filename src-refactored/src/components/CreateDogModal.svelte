<script>
    import { createDog, uploadImage } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { pushModalState, popModalState } from '../../js/modal-history.js';
    import { toggleBodyScroll } from '../../js/ui.js';
    import { showToast } from '../../js/toast-store.svelte.js';
    import { validateAndPreview, revokePreview } from '../../js/file-handler.js';
    import { modals, closeCreateDogModal as storeClose, openAuthModal } from '../../js/modal-store.svelte.js';
    import { bumpDogVersion } from '../../js/svelte-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import { focusTrap } from '../actions/focus-trap.ts';
    import BreedAutocomplete from './BreedAutocomplete.svelte';
    import TerritoryAutocomplete from './TerritoryAutocomplete.svelte';

    let submitting = $state(false);

    // Form fields
    let dogName = $state('');
    let breedId = $state('');
    let breedName = $state('');
    let dateOfBirth = $state('');
    let territoryId = $state('');
    let territoryName = $state('');
    let bio = $state('');
    let photoFile = $state(null);
    let previewUrl = $state(null);

    let photoInputEl = $state(null);

    // Manage body scroll + modal history based on store state
    $effect(() => {
        if (modals.createDogModalOpen) {
            pushModalState();
            toggleBodyScroll(true);
            return () => {
                popModalState();
                toggleBodyScroll(false);
            };
        }
    });

    function close() {
        if (!modals.createDogModalOpen) return;
        storeClose();
        resetForm();
    }

    function resetForm() {
        dogName = '';
        breedId = '';
        breedName = '';
        dateOfBirth = '';
        territoryId = '';
        territoryName = '';
        bio = '';
        photoFile = null;
        revokePreview(previewUrl);
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
            revokePreview(previewUrl);
            previewUrl = null;
            photoFile = null;
            return;
        }
        const result = validateAndPreview(file);
        if (!result) {
            e.target.value = '';
            return;
        }
        revokePreview(previewUrl);
        photoFile = result.file;
        previewUrl = result.previewUrl;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!isAuthenticated()) {
            showToast(t('dog.loginRequired'), 'error');
            close();
            openAuthModal();
            return;
        }

        if (!breedId) {
            showToast(t('dog.selectBreed'), 'error');
            return;
        }

        if (!photoFile) {
            showToast(t('dog.addPhoto'), 'error');
            return;
        }

        submitting = true;
        try {
            showToast(t('dog.uploadingPhoto'), 'info');
            const profilePhoto = await uploadImage(photoFile);

            const dogData = {
                name: dogName.trim(),
                breed_id: breedId,
                date_of_birth: dateOfBirth,
                profile_photo: profilePhoto,
                ...(bio.trim() && { bio: bio.trim() }),
                ...(territoryId && { territory_id: territoryId }),
            };

            const createdDog = await createDog(dogData);
            close();
            bumpDogVersion();

            if (createdDog && createdDog.slug) {
                history.pushState({}, '', `/dog/${createdDog.slug}`);
                window.dispatchEvent(new CustomEvent('routechange'));
            }
        } catch (err) {
            console.error('Failed to create dog:', err);
            showToast(t('common.error'), 'error');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div
    id="create-dog-modal"
    class="modal"
    style:display={modals.createDogModalOpen ? 'block' : 'none'}
    onclick={handleOverlayClick}
    onkeydown={() => {}}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div class="modal-content" use:focusTrap>
        <div class="modal-header">
            <h2>{t('dog.addPet')}</h2>
            <button class="modal-close" aria-label={t('common.close')} onclick={close}>&times;</button>
        </div>
        <div class="modal-body">
            <form id="create-dog-form" onsubmit={handleSubmit}>
                <div class="form-group">
                    <label for="dog-name">{t('dog.nameLabel')}</label>
                    <input
                        type="text"
                        id="dog-name"
                        required
                        maxlength="50"
                        placeholder={t('dog.namePlaceholder')}
                        bind:value={dogName}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-breed">{t('dog.breedLabel')}</label>
                    <BreedAutocomplete
                        id="dog-breed"
                        required={true}
                        bind:selectedBreedId={breedId}
                        bind:selectedBreedName={breedName}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-dob">{t('dog.dobLabel')}</label>
                    <input
                        type="date"
                        id="dog-dob"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        min="1990-01-01"
                        bind:value={dateOfBirth}
                    />
                </div>
                <div class="form-group">
                    <label for="dog-territory">{t('dog.territoryLabel')}</label>
                    <TerritoryAutocomplete
                        id="dog-territory"
                        bind:selectedTerritoryId={territoryId}
                        bind:selectedTerritoryName={territoryName}
                    />
                    <small class="form-hint">{t('dog.territoryHint')}</small>
                </div>
                <div class="form-group">
                    <label for="dog-bio">{t('dog.bioLabel')}</label>
                    <textarea
                        id="dog-bio"
                        rows="3"
                        maxlength="500"
                        placeholder={t('dog.bioPlaceholder')}
                        bind:value={bio}
                    ></textarea>
                </div>
                <div class="form-group">
                    <label for="dog-photo">{t('dog.photoLabel')}</label>
                    <input
                        type="file"
                        id="dog-photo"
                        accept="image/*"
                        required
                        bind:this={photoInputEl}
                        onchange={handlePhotoChange}
                    />
                    <small class="form-hint">{t('dog.photoHint')}</small>
                    <div id="dog-photo-preview" class="image-preview">
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt="Preview"
                                class="photo-preview-img"
                            />
                        {/if}
                    </div>
                </div>
                <button type="submit" class="btn-primary" disabled={submitting}>
                    {submitting ? t('dog.adding') : t('dog.addPetBtn')}
                </button>
            </form>
        </div>
    </div>
</div>
