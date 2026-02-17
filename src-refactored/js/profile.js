/**
 * Profile Page Functionality
 * Handles dog profile display and interactions
 */

import { getDog, getDogBySlug } from './api.js';
import { showLoading, hideLoading, showError, showProfileSkeleton } from './ui.js';
import { escapeHTML, formatDate } from './utils.js';

/**
 * Initialize profile page
 * @param {string} slugOrId - Dog slug (e.g., 'nelli-1') or ID to load
 */
export async function initProfile(slugOrId) {
    // Support both SPA (.profile-container) and legacy (.profile) selectors
    const profileContainer = document.querySelector('.profile-container') || document.querySelector('.profile');
    if (!profileContainer) return;

    try {
        showProfileSkeleton(profileContainer);

        // Detect if parameter is a slug (contains dash) or ID (numeric)
        const dog = slugOrId.includes('-')
            ? await getDogBySlug(slugOrId)
            : await getDog(slugOrId);

        renderProfile(dog, profileContainer);
    } catch (error) {
        showError(profileContainer, 'Failed to load profile', () => initProfile(slugOrId));
    }
}

/**
 * Render dog profile
 * @param {object} dog - Dog data
 * @param {HTMLElement} container - Container element
 */
function renderProfile(dog, container) {
    // Security: Escape all user-generated content
    const name = escapeHTML(dog.name);
    const breed = escapeHTML(dog.breed);
    const location = dog.location ? escapeHTML(dog.location) : 'Unknown';
    const bio = dog.bio ? escapeHTML(dog.bio) : 'No bio yet';

    // Fix profile photo path if it starts with /
    const profilePhoto = dog.profilePhoto && dog.profilePhoto.startsWith('/')
        ? `/assets/images${dog.profilePhoto}`
        : dog.profilePhoto || '/assets/images/dog_profile_pic.jpg';

    container.innerHTML = `
        <section class="profile">
            <h2>${name}'s Profile</h2>
            <div class="profile-header">
                <img src="${profilePhoto}"
                     alt="${name}'s Profile Picture"
                     class="profile-pic-large"
                     onerror="if(this.src!=='/assets/images/dog_profile_pic.jpg') this.src='/assets/images/dog_profile_pic.jpg'">
                <div class="profile-info">
                    <h3>${name}</h3>
                    <p><strong>Breed:</strong> ${breed}</p>
                    <p><strong>Age:</strong> ${dog.age} years</p>
                    <p><strong>Location:</strong> ${location}</p>
                </div>
            </div>
            <div class="profile-details">
                <h3>About</h3>
                <p>${bio}</p>
            </div>
        </section>
    `;
}

/**
 * Initialize profile tabs
 */
export function initProfileTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all tabs
            tabLinks.forEach(l => {
                l.classList.remove('active');
                l.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-hidden', 'true');
            });

            // Add active class to clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');

            // Show corresponding content
            const tabId = this.dataset.tab;
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.setAttribute('aria-hidden', 'false');
            }
        });
    });
}

/**
 * Load dog gallery
 * @param {string} dogId - Dog ID
 */
export async function loadGallery(dogId) {
    const galleryContainer = document.querySelector('#gallery .gallery');
    if (!galleryContainer) return;

    // TODO: Replace with real API call when photo endpoint exists
    galleryContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-camera"></i>
            <p>No photos yet. Start adding memories!</p>
        </div>
    `;
}

/**
 * Load dog friends
 * @param {string} dogId - Dog ID
 */
export async function loadFriends(dogId) {
    const friendsContainer = document.querySelector('#friends .friend-list');
    if (!friendsContainer) return;

    // TODO: Replace with real API call when friends endpoint exists
    friendsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-user-friends"></i>
            <p>No friends yet. Start connecting!</p>
        </div>
    `;
}

/**
 * Load health records (owner only)
 * @param {string} dogId - Dog ID
 */
export async function loadHealthRecords(dogId) {
    const healthContainer = document.querySelector('#health');
    if (!healthContainer) return;

    // Check if user is authenticated (TODO: implement proper auth check)
    const isOwner = false; // Will be true once we have authentication

    if (!isOwner) {
        healthContainer.innerHTML = `
            <div class="private-content">
                <i class="fas fa-lock"></i>
                <p>Health records are private and only visible to the owner.</p>
            </div>
        `;
        return;
    }

    // TODO: Replace with real API call when health records endpoint exists
    healthContainer.innerHTML = `
        <h2>Health Records</h2>
        <div class="empty-state">
            <i class="fas fa-heartbeat"></i>
            <p>No health records yet.</p>
        </div>
    `;
}
