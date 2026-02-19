/**
 * Navigation Management
 * Handles dynamic navigation based on authentication state
 */

import { getMyDogs } from './api.js';
import { getToken } from './auth.js';
import { openSearchPanel } from './search.js';
import { escapeHTML } from './utils.js';

/**
 * Update profile navigation item based on auth state and user's dogs
 * Updates both the sidebar (desktop) and bottom nav (mobile)
 */
export async function updateProfileNavigation() {
    const profileNavItem = document.getElementById('profile-nav-item');
    const bottomNavProfile = document.getElementById('bottom-nav-profile');

    const token = getToken();

    // Not logged in - show "Add a pet" that prompts login
    if (!token) {
        if (profileNavItem) {
            profileNavItem.innerHTML = `
                <a href="#" class="auth-link">
                    <i class="fas fa-plus"></i> Add a Pet
                </a>
            `;
            const link = profileNavItem.querySelector('.auth-link');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    authModal.style.display = 'block';
                }
            });
        }

        // Bottom nav: user icon that opens auth modal
        if (bottomNavProfile) {
            bottomNavProfile.innerHTML = '<i class="fas fa-user-circle"></i>';
            bottomNavProfile.removeAttribute('data-link');
            bottomNavProfile.href = '#';
            bottomNavProfile.onclick = (e) => {
                e.preventDefault();
                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.style.display = 'block';
            };
        }
        return;
    }

    // Logged in - fetch user's dogs
    try {
        const dogs = await getMyDogs();

        if (dogs.length === 0) {
            // No dogs - show "Add a pet" that goes to create form
            if (profileNavItem) {
                profileNavItem.innerHTML = `
                    <a href="#" id="add-pet-link">
                        <i class="fas fa-plus"></i> Add a Pet
                    </a>
                `;
                const link = profileNavItem.querySelector('#add-pet-link');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const createModal = document.getElementById('create-dog-modal');
                    if (createModal) {
                        createModal.style.display = 'block';
                    }
                });
            }

            // Bottom nav: plus icon that opens create-dog modal
            if (bottomNavProfile) {
                bottomNavProfile.innerHTML = '<i class="fas fa-plus-circle"></i>';
                bottomNavProfile.removeAttribute('data-link');
                bottomNavProfile.href = '#';
                bottomNavProfile.onclick = (e) => {
                    e.preventDefault();
                    const createModal = document.getElementById('create-dog-modal');
                    if (createModal) createModal.style.display = 'block';
                };
            }
        } else if (dogs.length === 1) {
            // One dog - show dog's name and profile pic
            const dog = dogs[0];
            const profilePhoto = dog.profilePhoto || '/assets/images/dog_profile_pic.jpg';
            const slug = dog.slug || `${dog.name.toLowerCase()}-${dog.displayId}`;

            if (profileNavItem) {
                profileNavItem.innerHTML = `
                    <a href="/dog/${encodeURIComponent(slug)}" data-link>
                        <img src="${escapeHTML(profilePhoto)}"
                             alt="${escapeHTML(dog.name)}"
                             class="profile-pic"
                             onerror="this.src='/assets/images/dog_profile_pic.jpg'">
                        ${escapeHTML(dog.name)}
                    </a>
                `;
            }

            // Bottom nav: profile pic linking to dog profile
            if (bottomNavProfile) {
                bottomNavProfile.innerHTML = `
                    <img src="${escapeHTML(profilePhoto)}"
                         alt="${escapeHTML(dog.name)}"
                         class="profile-pic"
                         onerror="this.src='/assets/images/dog_profile_pic.jpg'">
                `;
                bottomNavProfile.href = `/dog/${slug}`;
                bottomNavProfile.setAttribute('data-link', '');
                bottomNavProfile.onclick = null;
            }
        } else {
            // Multiple dogs - show "My Pets"
            const firstDog = dogs[0];
            const slug = firstDog.slug || `${firstDog.name.toLowerCase()}-${firstDog.displayId}`;

            if (profileNavItem) {
                profileNavItem.innerHTML = `
                    <a href="/dog/${slug}" data-link>
                        <i class="fas fa-paw"></i> My Pets
                    </a>
                `;
            }

            // Bottom nav: paw icon linking to first dog
            if (bottomNavProfile) {
                bottomNavProfile.innerHTML = '<i class="fas fa-paw"></i>';
                bottomNavProfile.href = `/dog/${slug}`;
                bottomNavProfile.setAttribute('data-link', '');
                bottomNavProfile.onclick = null;
            }
        }
    } catch (error) {
        console.error('Failed to load user dogs for navigation:', error);
        if (profileNavItem) {
            profileNavItem.innerHTML = `
                <a href="#" class="auth-link">
                    <i class="fas fa-user"></i> Profile
                </a>
            `;
        }

        // Bottom nav fallback
        if (bottomNavProfile) {
            bottomNavProfile.innerHTML = '<i class="fas fa-user-circle"></i>';
            bottomNavProfile.href = '#';
            bottomNavProfile.removeAttribute('data-link');
            bottomNavProfile.onclick = null;
        }
    }
}

/**
 * Update active state of bottom nav based on current route
 */
export function updateBottomNavActiveState() {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const path = window.location.pathname;

    if (path === '/') {
        document.getElementById('bottom-nav-home')?.classList.add('active');
    } else if (path.startsWith('/dog/')) {
        // Highlight profile tab if viewing own dog's profile
        const profileLink = document.getElementById('bottom-nav-profile');
        if (profileLink && profileLink.getAttribute('href') === path) {
            profileLink.classList.add('active');
        }
    }
}

/**
 * Initialize navigation
 * Call this on app startup and after auth state changes
 */
export async function initNavigation() {
    await updateProfileNavigation();
    updateBottomNavActiveState();

    // Bottom nav search button
    const bottomNavSearch = document.getElementById('bottom-nav-search');
    if (bottomNavSearch) {
        bottomNavSearch.addEventListener('click', (e) => {
            e.preventDefault();
            openSearchPanel();
        });
    }

    // Update active state on route changes
    window.addEventListener('routechange', () => {
        updateBottomNavActiveState();
    });
}
