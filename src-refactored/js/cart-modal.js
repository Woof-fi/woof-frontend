/**
 * Cart Modal
 * Handles shopping cart drawer and cart state management
 */

/**
 * Initialize cart modal
 */
export function initCartModal() {
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
export function closeCartDrawer() {
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
