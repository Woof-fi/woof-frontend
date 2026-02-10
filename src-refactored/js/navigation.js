/**
 * Navigation Management
 * Handles dynamic navigation based on authentication state
 */

import { getMyDogs } from './api.js';
import { getToken } from './auth.js';

/**
 * Update profile navigation item based on auth state and user's dogs
 */
export async function updateProfileNavigation() {
    const profileNavItem = document.getElementById('profile-nav-item');
    if (!profileNavItem) return;

    const token = getToken();

    // Not logged in - show "Add a pet" that prompts login
    if (!token) {
        profileNavItem.innerHTML = `
            <a href="#" class="auth-link">
                <i class="fas fa-plus"></i> Add a Pet
            </a>
        `;
        // Clicking will trigger auth modal
        const link = profileNavItem.querySelector('.auth-link');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'block';
            }
        });
        return;
    }

    // Logged in - fetch user's dogs
    try {
        const dogs = await getMyDogs();

        if (dogs.length === 0) {
            // No dogs - show "Add a pet" that goes to create form
            profileNavItem.innerHTML = `
                <a href="#" id="add-pet-link">
                    <i class="fas fa-plus"></i> Add a Pet
                </a>
            `;
            // Clicking will open create dog modal
            const link = profileNavItem.querySelector('#add-pet-link');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const createModal = document.getElementById('create-dog-modal');
                if (createModal) {
                    createModal.style.display = 'block';
                }
            });
        } else if (dogs.length === 1) {
            // One dog - show dog's name and profile pic
            const dog = dogs[0];
            const profilePhoto = dog.profilePhoto || 'assets/images/dog_profile_pic.jpg';
            const slug = dog.slug || `${dog.name.toLowerCase()}-${dog.displayId}`;

            profileNavItem.innerHTML = `
                <a href="/dog/${slug}" data-link>
                    <img src="${profilePhoto}"
                         alt="${dog.name}"
                         class="profile-pic"
                         onerror="this.src='assets/images/dog_profile_pic.jpg'">
                    ${dog.name}
                </a>
            `;
        } else {
            // Multiple dogs - show "My Pets"
            // TODO: In the future, this could open a dropdown to select which pet
            const firstDog = dogs[0];
            const slug = firstDog.slug || `${firstDog.name.toLowerCase()}-${firstDog.displayId}`;

            profileNavItem.innerHTML = `
                <a href="/dog/${slug}" data-link>
                    <i class="fas fa-paw"></i> My Pets
                </a>
            `;
        }
    } catch (error) {
        console.error('Failed to load user dogs for navigation:', error);
        // On error, show generic profile link
        profileNavItem.innerHTML = `
            <a href="#" class="auth-link">
                <i class="fas fa-user"></i> Profile
            </a>
        `;
    }
}

/**
 * Initialize navigation
 * Call this on app startup and after auth state changes
 */
export async function initNavigation() {
    await updateProfileNavigation();
}
