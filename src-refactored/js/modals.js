/**
 * Modal Management
 * Handles all modal interactions, opening, closing, and form submissions
 */

import { createPost } from './posts.js';
import { toggleBodyScroll, focusFirstElement } from './ui.js';
import { trapFocus, showToast } from './utils.js';
import { login, register, isAuthenticated, logout, getCurrentUser } from './auth.js';

/**
 * Initialize modal functionality
 */
export function initModals() {
    initCreatePostModal();
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
function openCreatePostModal() {
    // Check authentication first
    if (!isAuthenticated()) {
        showToast('Please login to create a post', 'error');
        openAuthModal();
        return;
    }

    const modal = document.getElementById('create-post-modal');
    if (!modal) return;

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
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

    // Remove preview
    const preview = modal.querySelector('.image-preview');
    if (preview) preview.remove();
}

/**
 * Preview uploaded image
 * @param {File} file - Image file
 */
function previewImage(file) {
    const modal = document.getElementById('create-post-modal');
    if (!modal) return;

    // Remove existing preview
    const existingPreview = modal.querySelector('.image-preview');
    if (existingPreview) existingPreview.remove();

    // Create preview
    const preview = document.createElement('div');
    preview.className = 'image-preview';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'Image preview';

    preview.appendChild(img);

    // Insert before form
    const modalContent = modal.querySelector('.modal-content');
    const form = modal.querySelector('form');
    if (modalContent && form) {
        modalContent.insertBefore(preview, form);
    }
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
    drawer.setAttribute('aria-hidden', 'false');
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

        cartSummary.innerHTML = cart.map(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} — $${item.price} × ${item.quantity}`;
            return li.outerHTML;
        }).join('');

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
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');

    if (!authModal) return;

    // Show register form
    const showRegisterLink = document.getElementById('show-register');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerContainer) registerContainer.style.display = 'block';
        });
    }

    // Show login form
    const showLoginLink = document.getElementById('show-login');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerContainer) registerContainer.style.display = 'none';
            if (loginContainer) loginContainer.style.display = 'block';
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);

            try {
                await login(formData.get('email'), formData.get('password'));
                closeAuthModal();
                loginForm.reset();
                updateUIForAuth();
                // Reload page to refresh content
                window.location.reload();
            } catch (error) {
                // Error already shown by login()
            }
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);

            try {
                await register(
                    formData.get('email'),
                    formData.get('password'),
                    formData.get('name')
                );
                closeAuthModal();
                registerForm.reset();
                updateUIForAuth();
                // Reload page to refresh content
                window.location.reload();
            } catch (error) {
                // Error already shown by register()
            }
        });
    }

    // Close modal
    const closeButton = authModal.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', closeAuthModal);
    }

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
        modal.setAttribute('aria-hidden', 'false');
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
async function updateUIForAuth() {
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

    // Update navigation visibility and profile link text
    const messagesLinks = document.querySelectorAll('a[aria-label="Messages"]');
    const profileLinks = document.querySelectorAll('.left-panel a[href="nelli.html"], .bottom-nav a[href="nelli.html"]');

    if (isAuthenticated()) {
        // Show Messages and Profile links
        messagesLinks.forEach(link => {
            link.style.display = '';
        });
        profileLinks.forEach(link => {
            link.style.display = '';
        });

        // Update Profile link text with dog name
        const user = getCurrentUser();
        if (user && user.dogs && user.dogs.length > 0) {
            const profileText = user.dogs.length === 1 ? user.dogs[0].name : 'My Dogs';

            // Update desktop profile link text (left panel)
            const desktopProfileLink = document.querySelector('.left-panel a[href="nelli.html"]');
            if (desktopProfileLink) {
                const textNode = desktopProfileLink.childNodes[desktopProfileLink.childNodes.length - 1];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = ' ' + profileText;
                }
            }
        }
    } else {
        // Hide Messages and Profile links when not logged in
        messagesLinks.forEach(link => {
            link.style.display = 'none';
        });
        profileLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}

/**
 * Close all open modals
 */
function closeAllModals() {
    closeCreatePostModal();
    closeCartDrawer();
    closeAuthModal();

    const searchPanel = document.getElementById('search-panel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        searchPanel.classList.remove('active');
        toggleBodyScroll(false);
    }
}
