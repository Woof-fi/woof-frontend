/**
 * Create Dog Modal
 * Handles dog profile creation form and photo upload
 */

import { toggleBodyScroll } from './ui.js';
import { showToast } from './utils.js';
import { isAuthenticated } from './auth.js';
import { createDog, uploadImage } from './api.js';
import { updateProfileNavigation } from './navigation.js';
import { openAuthModal } from './auth-modal.js';
import { pushModalState, popModalState } from './modals.js';
import router from './router.js';

/**
 * Initialize create dog modal
 */
export function initCreateDogModal() {
    const createDogModal = document.getElementById('create-dog-modal');
    const createDogForm = document.getElementById('create-dog-form');

    if (!createDogModal || !createDogForm) return;

    // Close buttons
    const closeButtons = createDogModal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeCreateDogModal();
        });
    });

    // Click outside to close
    createDogModal.addEventListener('click', (e) => {
        if (e.target === createDogModal) {
            closeCreateDogModal();
        }
    });

    // Image preview
    const photoInput = document.getElementById('dog-photo');
    const photoPreview = document.getElementById('dog-photo-preview');

    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                photoPreview.innerHTML = '';
            }
        });
    }

    // Form submission
    createDogForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check authentication
        if (!isAuthenticated()) {
            showToast('Please login to add a pet', 'error');
            closeCreateDogModal();
            openAuthModal();
            return;
        }

        const submitButton = createDogForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';

        try {
            // Get form data
            const name = document.getElementById('dog-name').value.trim();
            const breed = document.getElementById('dog-breed').value.trim();
            const age = parseInt(document.getElementById('dog-age').value);
            const location = document.getElementById('dog-location').value.trim();
            const bio = document.getElementById('dog-bio').value.trim();
            const photoFile = photoInput.files[0];

            // Profile photo is required
            if (!photoFile) {
                showToast('Please add a profile photo for your dog', 'error');
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }

            showToast('Uploading photo...', 'info');
            const profilePhoto = await uploadImage(photoFile);

            // Create dog profile
            const dogData = {
                name,
                breed,
                age,
                profile_photo: profilePhoto,
                ...(location && { location }),
                ...(bio && { bio })
            };

            const createdDog = await createDog(dogData);

            // Update navigation to show the new dog
            await updateProfileNavigation();

            // Close and reset
            closeCreateDogModal();
            createDogForm.reset();
            photoPreview.innerHTML = '';

            // Navigate to the new dog's profile
            if (createdDog && createdDog.slug) {
                router.navigate(`/dog/${createdDog.slug}`);
            }
        } catch (error) {
            console.error('Failed to create dog:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

/**
 * Close create dog modal
 */
export function closeCreateDogModal() {
    const modal = document.getElementById('create-dog-modal');
    if (!modal || modal.style.display === 'none') return;

    modal.style.display = 'none';
    toggleBodyScroll(false);
    popModalState();
}
