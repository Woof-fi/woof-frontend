// Ensure the initMap function is globally accessible
function initMap() {
    // Check if the map element exists before trying to initialize the map
    const mapElement = document.getElementById("map");
    if (mapElement) {
        const map = new google.maps.Map(mapElement, {
            center: { lat: 60.232043945670185, lng: 24.95346683558198 },
            zoom: 14,
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('mobile-search-input');
    const desktopSearchInput = document.getElementById('desktop-search-input');
    const desktopSearchButton = document.getElementById('desktop-search-button');
    const searchResults = document.getElementById('search-results');
    const createPostLink = document.getElementById('create-post-link');
    const createPostLinkMobile = document.getElementById('create-post-link-mobile');
    const createPostModal = document.getElementById('create-post-modal');
    const closeModalButtons = document.querySelectorAll('.close');
    const bottomNavLinks = document.querySelectorAll('.bottom-nav a');
    const closeSearchBtn = document.querySelector('.close-search');

    if (desktopSearchInput && window.innerWidth <= 768) {
        desktopSearchInput.style.display = 'none';
    }

    // Tab Links
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            tabLinks.forEach(link => link.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    function openCreatePostModal(e) {
        if (e) e.preventDefault();
        if (createPostModal) {
            createPostModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            createPostModal.setAttribute('aria-hidden', 'false');
        }
    }

    function closeCreatePostModal() {
        if (createPostModal) {
            createPostModal.style.display = 'none';
            document.body.style.overflow = '';
            createPostModal.setAttribute('aria-hidden', 'true');
        }
        const form = document.getElementById('create-post-form');
        if (form) {
            form.reset();
        }
    }

    if (createPostLink) {
        createPostLink.addEventListener('click', openCreatePostModal);
    }
    if (createPostLinkMobile) {
        createPostLinkMobile.addEventListener('click', openCreatePostModal);
    }

    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('close-search')) {
                searchPanel.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                closeCreatePostModal();
            }
        });
    });

    if (createPostModal) {
        createPostModal.addEventListener('click', function(e) {
            if (e.target === createPostModal) closeCreatePostModal();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && createPostModal && createPostModal.style.display === 'block') {
            closeCreatePostModal();
        }
    });

    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const imageFile = document.getElementById('post-image').files[0];
            const caption = document.getElementById('post-caption').value;
            if (imageFile && caption) {
                const main = document.querySelector('.content');
                if (main) {
                    main.prepend(createPostElement(URL.createObjectURL(imageFile), caption));
                }
                closeCreatePostModal();
            }
        });
    }

    function createPostElement(imageUrl, caption) {
        const username = 'user_' + Math.floor(Math.random() * 1000);
        const post = document.createElement('div');
        post.className = 'post';
        post.innerHTML = `
            <div class="post-header">
                <img src="https://picsum.photos/32" alt="Profile picture">
                <strong>${username}</strong>
            </div>
            <div class="post-image">
                <img src="${imageUrl}" alt="User post">
            </div>
            <div class="post-actions">
                <button class="like-button" aria-label="Like post"><i class="far fa-heart"></i></button>
                <button aria-label="Comment on post"><i class="far fa-comment"></i></button>
                <button aria-label="Share post"><i class="far fa-paper-plane"></i></button>
            </div>
            <div class="post-caption">
                <p><strong>${username}</strong> ${caption}</p>
            </div>
        `;
        bindLikeButton(post.querySelector('.like-button'));
        return post;
    }

    function bindLikeButton(btn) {
        if (!btn) return;
        btn.addEventListener('click', function() {
            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far', !this.classList.contains('liked'));
                icon.classList.toggle('fas', this.classList.contains('liked'));
            }
        });
    }

    function toggleSearchPanel(e) {
        if (e) e.preventDefault();
        if (!searchPanel) return;
        searchPanel.classList.add('active');
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
        if (searchInput) searchInput.focus();
    }

    if (desktopSearchButton) {
        desktopSearchButton.addEventListener('click', toggleSearchPanel);
    }
    if (desktopSearchInput) {
        desktopSearchInput.addEventListener('focus', toggleSearchPanel);
    }

    document.addEventListener('click', function(e) {
        if (!searchPanel || !searchPanel.classList.contains('active')) return;
        if (searchPanel.contains(e.target) || (desktopSearchInput && desktopSearchInput.contains(e.target)) || (desktopSearchButton && desktopSearchButton.contains(e.target))) return;
        searchPanel.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close search modal using the "X" button
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', function() {
            searchPanel.classList.remove('active');
            document.body.style.overflow = 'auto'; // Re-enable scrolling on body
        });
    }

    // Close search modal when clicking on any bottom navigation link in mobile view
    bottomNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (searchPanel.classList.contains('active')) {
                searchPanel.classList.remove('active');
                document.body.style.overflow = 'auto'; // Re-enable scrolling on body
            }
        });
    });

    // Predictive search functionality
    const animalAccounts = [
        'fluffy_kitty', 'goodboy_rex', 'chirpy_bird', 'swimmy_fish', 'hoppy_bunny',
        'scaly_lizard', 'squeaky_hamster', 'wise_owl', 'playful_puppy', 'grumpy_cat'
    ];

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredAccounts = animalAccounts.filter(account => 
                account.toLowerCase().includes(searchTerm)
            );

            searchResults.innerHTML = '';
            filteredAccounts.forEach(account => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <img src="https://picsum.photos/40" alt="${account}">
                    <span>${account}</span>
                `;
                searchResults.appendChild(li);
            });
        });
    }

    // Close search panel when selecting a search result
    if (searchResults) {
        searchResults.addEventListener('click', function(e) {
            if (e.target.closest('li')) {
                searchPanel.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    document.querySelectorAll('.like-button').forEach(bindLikeButton);

    // Initialize the map on the map page only when the Google Maps script has fully loaded
    if (typeof google !== 'undefined') {
        initMap();
    } else {
        window.initMap = initMap;
    }

    let cart = [];
    const cartDrawer = document.getElementById('cart-drawer');
    const cartToggle = document.querySelector('.cart-toggle');

    function addToCart(productId, productName, productPrice) {
        const existing = cart.find(item => item.id === productId);
        if (existing) existing.quantity += 1;
        else cart.push({ id: productId, name: productName, price: productPrice, quantity: 1 });
        updateCartSummary();
        if (cartDrawer) {
            cartDrawer.classList.add('open');
        }
    }

    function updateCartSummary() {
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
            cartSummary.innerHTML = cart.map(item => `<li>${item.name} — $${item.price} × ${item.quantity}</li>`).join('');
        }
    }

    function toggleCartDrawer(e) {
        if (e) e.preventDefault();
        if (cartDrawer) cartDrawer.classList.toggle('open');
    }

    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCartDrawer);
        cartToggle.setAttribute('href', '#');
        cartToggle.setAttribute('aria-label', 'Cart');
    }
    const cartCloseBtn = document.getElementById('cart-drawer-close');
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', function() { cartDrawer.classList.remove('open'); });
    if (cartDrawer) {
        cartDrawer.addEventListener('click', function(e) {
            if (e.target === cartDrawer) cartDrawer.classList.remove('open');
        });
    }

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productItem = this.closest('.product-item');
            if (!productItem) return;
            const productId = productItem.dataset.id;
            const nameEl = productItem.querySelector('h3');
            const priceEl = productItem.querySelector('p');
            if (!nameEl || !priceEl) return;
            const productPrice = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0;
            addToCart(productId, nameEl.textContent.trim(), productPrice);
        });
    });

    if (cartDrawer) updateCartSummary();
});
