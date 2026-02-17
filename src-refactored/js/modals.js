/**
 * Modal Management
 * Handles all modal interactions, opening, closing, and form submissions
 */

import { createPost } from './posts.js';
import { toggleBodyScroll, focusFirstElement } from './ui.js';
import { trapFocus, showToast } from './utils.js';
import { login, register, isAuthenticated, logout } from './auth.js';
import { createDog, uploadImage, getMyDogs } from './api.js';
import { updateProfileNavigation } from './navigation.js';

/**
 * Initialize modal functionality
 */
export function initModals() {
    initCreatePostModal();
    initCreateDogModal();
    initCartModal();
    initAuthModal();
    updateUIForAuth();

    // Global escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Initialize create post modal
 */
function initCreatePostModal() {
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
                await createPost(formData);
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
function closeCreatePostModal() {
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

/**
 * Initialize cart modal
 */
function initCartModal() {
    const cartDrawer = document.getElementById('cart-drawer');
    const cartToggle = document.querySelector('.cart-toggle');
    const cartClose = document.getElementById('cart-drawer-close');

    if (!cartDrawer) return;

    // Open cart
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    // Close cart
    if (cartClose) {
        cartClose.addEventListener('click', () => {
            closeCartDrawer();
        });
    }

    // Click outside to close
    cartDrawer.addEventListener('click', (e) => {
        if (e.target === cartDrawer) {
            closeCartDrawer();
        }
    });

    // Initialize cart functionality
    initCart();
}

/**
 * Open cart drawer
 */
function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    drawer.classList.add('open');
    drawer.removeAttribute('aria-hidden');
}

/**
 * Close cart drawer
 */
function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
}

/**
 * Initialize shopping cart functionality
 */
function initCart() {
    const cartData = getCartData();
    updateCartDisplay(cartData);

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productItem = this.closest('.product-item');
            if (!productItem) return;

            const productId = productItem.dataset.id;
            const nameEl = productItem.querySelector('h3');
            const priceEl = productItem.querySelector('p');

            if (!nameEl || !priceEl) return;

            const product = {
                id: productId,
                name: nameEl.textContent.trim(),
                price: parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0,
                quantity: 1
            };

            addToCart(product);
        });
    });
}

/**
 * Get cart data from localStorage
 * @returns {object[]} - Cart items
 */
function getCartData() {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Failed to load cart:', error);
        return [];
    }
}

/**
 * Save cart data to localStorage
 * @param {object[]} cart - Cart items
 */
function saveCartData(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Failed to save cart:', error);
    }
}

/**
 * Add item to cart
 * @param {object} product - Product to add
 */
function addToCart(product) {
    let cart = getCartData();

    // Check if already in cart
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(product);
    }

    saveCartData(cart);
    updateCartDisplay(cart);
    openCartDrawer();
}

/**
 * Update cart display
 * @param {object[]} cart - Cart items
 */
function updateCartDisplay(cart) {
    const cartSummary = document.getElementById('cart-summary');
    const drawerBody = document.querySelector('.cart-drawer-body');

    if (!cartSummary || !drawerBody) return;

    if (cart.length === 0) {
        cartSummary.innerHTML = '';
        let msg = drawerBody.querySelector('.cart-drawer-empty');
        if (!msg) {
            msg = document.createElement('p');
            msg.className = 'cart-drawer-empty';
            drawerBody.appendChild(msg);
        }
        msg.textContent = 'Your cart is empty.';
    } else {
        const emptyMsg = drawerBody.querySelector('.cart-drawer-empty');
        if (emptyMsg) emptyMsg.remove();

        // Clear existing items
        cartSummary.innerHTML = '';

        // Safely append each cart item
        cart.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} — $${item.price} × ${item.quantity}`;
            cartSummary.appendChild(li);
        });

        // Update cart badge
        updateCartBadge(cart.length);
    }
}

/**
 * Update cart badge count
 * @param {number} count - Number of items
 */
function updateCartBadge(count) {
    let badge = document.querySelector('.cart-badge');
    const cartToggle = document.querySelector('.cart-toggle');

    if (count > 0) {
        if (!badge && cartToggle) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartToggle.appendChild(badge);
        }
        if (badge) {
            badge.textContent = count;
        }
    } else {
        if (badge) badge.remove();
    }
}

/**
 * Initialize auth modal
 */
function initAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authTabs = document.querySelectorAll('.auth-tab');
    const nameGroup = document.getElementById('auth-name-group');
    const authSubmit = document.getElementById('auth-submit');
    const authModalTitle = document.getElementById('auth-modal-title');

    if (!authModal || !authForm) return;

    let currentMode = 'login'; // 'login' or 'register'

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch mode
            const mode = tab.dataset.tab;
            currentMode = mode;

            // Update UI based on mode
            if (mode === 'register') {
                nameGroup.style.display = 'block';
                authSubmit.textContent = 'Sign Up';
                authModalTitle.textContent = 'Register';
            } else {
                nameGroup.style.display = 'none';
                authSubmit.textContent = 'Sign In';
                authModalTitle.textContent = 'Login';
            }
        });
    });

    // Form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value;

        const submitButton = authForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = currentMode === 'login' ? 'Logging in...' : 'Registering...';

        try {
            if (currentMode === 'register') {
                await register(email, password, name);
            } else {
                await login(email, password);
            }

            closeAuthModal();
            authForm.reset();

            // Update navigation after successful auth
            await updateProfileNavigation();
            await updateUIForAuth();
        } catch (error) {
            // Error already shown by login()/register()
            console.error('Auth error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Close buttons
    const closeButtons = authModal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAuthModal);
    });

    // Close on outside click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });
}

/**
 * Open auth modal
 */
export function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
        modal.removeAttribute('aria-hidden');
        toggleBodyScroll(true);
    }
}

/**
 * Close auth modal
 */
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        toggleBodyScroll(false);
    }
}

/**
 * Update UI based on authentication state
 */
export async function updateUIForAuth() {
    // Update auth link in header
    const authLinks = document.querySelectorAll('.auth-link');

    authLinks.forEach(authLink => {
        if (!authLink) return;

        if (isAuthenticated()) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            authLink.onclick = (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            };
        } else {
            authLink.innerHTML = '<i class="fas fa-user-circle"></i> Login';
            authLink.onclick = (e) => {
                e.preventDefault();
                openAuthModal();
            };
        }
    });

    // Update navigation visibility
    const messagesLinks = document.querySelectorAll('a[aria-label="Messages"]');

    if (isAuthenticated()) {
        messagesLinks.forEach(link => {
            link.style.display = '';
        });
    } else {
        messagesLinks.forEach(link => {
            link.style.display = 'none';
        });
    }

    // Profile navigation is handled dynamically by navigation.js
    await updateProfileNavigation();
}

/**
 * Initialize create dog modal
 */
function initCreateDogModal() {
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

            // Upload photo if provided
            let profilePhoto = null;
            if (photoFile) {
                showToast('Uploading photo...', 'info');
                profilePhoto = await uploadImage(photoFile);
            }

            // Create dog profile
            const dogData = {
                name,
                breed,
                age,
                ...(location && { location }),
                ...(bio && { bio }),
                ...(profilePhoto && { profilePhoto })
            };

            await createDog(dogData);

            // Update navigation to show the new dog
            await updateProfileNavigation();

            // Close and reset
            closeCreateDogModal();
            createDogForm.reset();
            photoPreview.innerHTML = '';
        } catch (error) {
            console.error('Failed to create dog:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

/**
 * Open create dog modal
 */
function openCreateDogModal() {
    // Check authentication first
    if (!isAuthenticated()) {
        showToast('Please login to add a pet', 'error');
        openAuthModal();
        return;
    }

    const modal = document.getElementById('create-dog-modal');
    if (!modal) return;

    modal.style.display = 'block';
    toggleBodyScroll(true);

    // Focus first input
    const firstInput = modal.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

/**
 * Close create dog modal
 */
function closeCreateDogModal() {
    const modal = document.getElementById('create-dog-modal');
    if (!modal) return;

    modal.style.display = 'none';
    toggleBodyScroll(false);
}

/**
 * Close all open modals
 */
function closeAllModals() {
    closeCreatePostModal();
    closeCreateDogModal();
    closeCartDrawer();
    closeAuthModal();

    const searchPanel = document.getElementById('search-panel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        searchPanel.classList.remove('active');
        toggleBodyScroll(false);
    }
}
