/**
 * Edit Dog Modal
 * Handles editing an existing dog profile
 */

import { toggleBodyScroll } from './ui.js';
import { showToast } from './utils.js';
import { updateDog, uploadImage } from './api.js';
import { initProfile } from './profile.js';

// Store callback to refresh profile after edit
let onSaveCallback = null;

/**
 * Initialize edit dog modal
 */
export function initEditDogModal() {
    const editDogModal = document.getElementById('edit-dog-modal');
    const editDogForm = document.getElementById('edit-dog-form');

    if (!editDogModal || !editDogForm) return;

    // Close buttons
    const closeButtons = editDogModal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeEditDogModal();
        });
    });

    // Click outside to close
    editDogModal.addEventListener('click', (e) => {
        if (e.target === editDogModal) {
            closeEditDogModal();
        }
    });

    // Image preview
    const photoInput = document.getElementById('edit-dog-photo');
    const photoPreview = document.getElementById('edit-dog-photo-preview');

    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    photoPreview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                photoPreview.innerHTML = '';
            }
        });
    }

    // Form submission
    editDogForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = editDogForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        try {
            const dogId = document.getElementById('edit-dog-id').value;
            const name = document.getElementById('edit-dog-name').value.trim();
            const breed = document.getElementById('edit-dog-breed').value.trim();
            const age = parseInt(document.getElementById('edit-dog-age').value);
            const location = document.getElementById('edit-dog-location').value.trim();
            const bio = document.getElementById('edit-dog-bio').value.trim();
            const photoFile = photoInput?.files[0];

            // Upload new photo if provided
            let profile_photo = undefined;
            if (photoFile) {
                showToast('Uploading photo...', 'info');
                profile_photo = await uploadImage(photoFile);
            }

            const dogData = {
                name,
                breed,
                age,
                location,
                bio,
                ...(profile_photo && { profile_photo })
            };

            await updateDog(dogId, dogData);
            showToast('Profile updated!', 'success');

            closeEditDogModal();

            // Refresh the profile page
            if (onSaveCallback) {
                onSaveCallback();
            }
        } catch (error) {
            console.error('Failed to update dog:', error);
            showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

/**
 * Open edit dog modal with pre-populated data
 * @param {object} dog - Current dog data
 * @param {Function} [callback] - Called after successful save (e.g., to refresh profile)
 */
export function openEditDogModal(dog, callback = null) {
    const modal = document.getElementById('edit-dog-modal');
    if (!modal) return;

    onSaveCallback = callback;

    // Pre-populate fields
    document.getElementById('edit-dog-id').value = dog.id;
    document.getElementById('edit-dog-name').value = dog.name || '';
    document.getElementById('edit-dog-breed').value = dog.breed || '';
    document.getElementById('edit-dog-age').value = dog.age ?? '';
    document.getElementById('edit-dog-location').value = dog.location || '';
    document.getElementById('edit-dog-bio').value = dog.bio || '';

    // Show current photo in preview
    const photoPreview = document.getElementById('edit-dog-photo-preview');
    if (photoPreview && dog.profilePhoto) {
        photoPreview.innerHTML = `<img src="${dog.profilePhoto}" alt="Current photo" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
    } else if (photoPreview) {
        photoPreview.innerHTML = '';
    }

    // Clear file input
    const photoInput = document.getElementById('edit-dog-photo');
    if (photoInput) photoInput.value = '';

    modal.style.display = 'block';
    toggleBodyScroll(true);
}

/**
 * Close edit dog modal
 */
export function closeEditDogModal() {
    const modal = document.getElementById('edit-dog-modal');
    if (!modal) return;

    modal.style.display = 'none';
    toggleBodyScroll(false);
    onSaveCallback = null;
}
