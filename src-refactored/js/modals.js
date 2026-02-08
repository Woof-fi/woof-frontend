/**
 * Modal Management
 * Handles all modal interactions, opening, closing, and form submissions
 */

import { createPost } from './posts.js';
import { toggleBodyScroll, focusFirstElement } from './ui.js';
import { trapFocus } from './utils.js';

/**
 * Initialize modal functionality
 */
export function initModals() {
    initCreatePostModal();
    initCartModal();

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
 * Close all open modals
 */
function closeAllModals() {
    closeCreatePostModal();
    closeCartDrawer();

    const searchPanel = document.getElementById('search-panel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        searchPanel.classList.remove('active');
        toggleBodyScroll(false);
    }
}
