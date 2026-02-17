/**
 * Create Post Modal
 * Handles post creation form, image preview, and dog selection
 */

import { createPost } from './posts.js';
import { toggleBodyScroll } from './ui.js';
import { trapFocus, showToast } from './utils.js';
import { isAuthenticated } from './auth.js';
import { getMyDogs } from './api.js';
import { openAuthModal } from './auth-modal.js';

/**
 * Initialize create post modal
 */
export function initCreatePostModal() {
    const createPostLink = document.getElementById('create-post-link');
    const createPostLinkMobile = document.getElementById('create-post-link-mobile');
    const createPostModal = document.getElementById('create-post-modal');
    const createPostForm = document.getElementById('create-post-form');
    const closeButtons = document.querySelectorAll('.close');

    if (!createPostModal) return;

    // Open modal - desktop
    if (createPostLink) {
        createPostLink.addEventListener('click', (e) => {
            e.preventDefault();
            openCreatePostModal();
        });
    }

    // Open modal - mobile
    if (createPostLinkMobile) {
        createPostLinkMobile.addEventListener('click', (e) => {
            e.preventDefault();
            openCreatePostModal();
        });
    }

    // Close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.closest('#create-post-modal')) {
                closeCreatePostModal();
            }
        });
    });

    // Click outside to close
    createPostModal.addEventListener('click', (e) => {
        if (e.target === createPostModal) {
            closeCreatePostModal();
        }
    });

    // Form submission
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(createPostForm);

            try {
                const success = await createPost(formData);
                if (!success) return; // Validation failed — toast already shown, keep modal open

                closeCreatePostModal();
                createPostForm.reset();

                // Clear preview
                const previewContainer = document.getElementById('image-preview');
                if (previewContainer) previewContainer.innerHTML = '';

                // Navigate to home to see the new post
                if (window.WoofApp && window.WoofApp.router) {
                    window.WoofApp.router.navigate('/');
                }
            } catch (error) {
                console.error('Failed to create post:', error);
            }
        });
    }

    // Image preview
    const imageInput = document.getElementById('post-image');
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                previewImage(file);
            }
        });
    }
}

/**
 * Open create post modal
 */
async function openCreatePostModal() {
    // Check authentication first
    if (!isAuthenticated()) {
        showToast('Please login to create a post', 'error');
        openAuthModal();
        return;
    }

    const modal = document.getElementById('create-post-modal');
    const dogSelect = document.getElementById('post-dog-select');
    if (!modal || !dogSelect) return;

    // Fetch user's dogs and populate select
    try {
        const dogs = await getMyDogs();

        if (dogs.length === 0) {
            showToast('Please add a dog first', 'error');
            // Open create dog modal instead
            const createDogModal = document.getElementById('create-dog-modal');
            if (createDogModal) {
                createDogModal.style.display = 'block';
            }
            return;
        }

        // Populate dog select
        dogSelect.innerHTML = '<option value="">Choose a dog...</option>';
        dogs.forEach(dog => {
            const option = document.createElement('option');
            option.value = dog.id;
            option.textContent = dog.name;
            dogSelect.appendChild(option);
        });

        // Auto-select if only one dog
        if (dogs.length === 1) {
            dogSelect.value = dogs[0].id;
            dogSelect.parentElement.style.display = 'none'; // Hide the select since there's only one option
        } else {
            dogSelect.parentElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load dogs:', error);
        showToast('Failed to load your dogs', 'error');
        return;
    }

    modal.style.display = 'block';
    modal.removeAttribute('aria-hidden'); // Don't set aria-hidden on visible modal
    toggleBodyScroll(true);

    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input[type="file"]');
        if (firstInput) firstInput.focus();
    }, 100);

    // Trap focus
    trapFocus(modal);
}

/**
 * Close create post modal
 */
export function closeCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if (!modal) return;

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    toggleBodyScroll(false);

    // Reset form
    const form = document.getElementById('create-post-form');
    if (form) form.reset();

    // Clear preview
    const previewContainer = document.getElementById('image-preview');
    if (previewContainer) previewContainer.innerHTML = '';
}

/**
 * Preview uploaded image
 * @param {File} file - Image file
 */
function previewImage(file) {
    const previewContainer = document.getElementById('image-preview');
    if (!previewContainer) return;

    // Clear existing preview
    previewContainer.innerHTML = '';

    // Create preview image
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'Image preview';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '300px';
    img.style.borderRadius = '8px';
    img.style.marginTop = '10px';

    previewContainer.appendChild(img);
}
