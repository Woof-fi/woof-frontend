/**
 * Profile Page Functionality
 * Handles dog profile display, edit button, and follow button
 */

import { getDog, getDogBySlug, getDogPosts, getFollowStatus, followDog, unfollowDog } from './api.js';
import { showLoading, hideLoading, showError, showProfileSkeleton } from './ui.js';
import { escapeHTML, formatDate, showToast, timeAgo } from './utils.js';
import { isAuthenticated } from './auth.js';
import { openEditDogModal } from './edit-dog-modal.js';

// Store current dog data for edit modal
let currentDog = null;

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

        currentDog = dog;
        renderProfile(dog, profileContainer, slugOrId);
    } catch (error) {
        showError(profileContainer, 'Failed to load profile', () => initProfile(slugOrId));
    }
}

/**
 * Render dog profile
 * @param {object} dog - Dog data
 * @param {HTMLElement} container - Container element
 * @param {string} slugOrId - Current slug/ID for reloading
 */
function renderProfile(dog, container, slugOrId) {
    // Security: Escape all user-generated content
    const name = escapeHTML(dog.name);
    const breed = escapeHTML(dog.breed);
    const location = dog.location ? escapeHTML(dog.location) : 'Unknown';
    const bio = dog.bio ? escapeHTML(dog.bio) : 'No bio yet';

    // Fix profile photo path if it starts with /
    const profilePhoto = dog.profilePhoto && dog.profilePhoto.startsWith('/')
        ? `/assets/images${dog.profilePhoto}`
        : dog.profilePhoto || '/assets/images/dog_profile_pic.jpg';

    // Build action button HTML
    let actionButtonHtml = '';
    if (dog.isOwner) {
        actionButtonHtml = `
            <button class="edit-profile-btn" id="edit-profile-btn">
                <i class="fas fa-edit"></i> Edit Profile
            </button>
        `;
    } else {
        // Follow button placeholder — state set after render
        actionButtonHtml = `
            <button class="follow-btn" id="follow-btn" data-dog-id="${dog.id}" disabled>
                <i class="fas fa-user-plus"></i> Follow
            </button>
        `;
    }

    // Follower/following counts placeholder
    const statsHtml = `
        <div class="profile-stats" id="profile-stats">
            <span><strong id="follower-count">-</strong> followers</span>
            <span><strong id="following-count">-</strong> following</span>
        </div>
    `;

    container.innerHTML = `
        <section class="profile">
            <div class="profile-header">
                <img src="${profilePhoto}"
                     alt="${name}'s Profile Picture"
                     class="profile-pic-large"
                     onerror="if(this.src!=='/assets/images/dog_profile_pic.jpg') this.src='/assets/images/dog_profile_pic.jpg'">
                <div class="profile-info">
                    <div class="profile-name-row">
                        <h3>${name}</h3>
                        ${actionButtonHtml}
                    </div>
                    ${statsHtml}
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

    // Wire up edit button
    if (dog.isOwner) {
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                openEditDogModal(dog, () => initProfile(slugOrId));
            });
        }
    }

    // Wire up follow button and load follow status
    if (!dog.isOwner && dog.id) {
        loadFollowStatus(dog.id);
    }
}

/**
 * Load follow status and wire up follow/unfollow button
 * @param {string} dogId - Dog ID
 */
async function loadFollowStatus(dogId) {
    const followBtn = document.getElementById('follow-btn');
    const followerCountEl = document.getElementById('follower-count');
    const followingCountEl = document.getElementById('following-count');

    try {
        const status = await getFollowStatus(dogId);

        // Update counts
        if (followerCountEl) followerCountEl.textContent = status.followerCount;
        if (followingCountEl) followingCountEl.textContent = status.followingCount;

        // Update button state
        if (followBtn) {
            followBtn.disabled = false;
            updateFollowButton(followBtn, status.isFollowing);

            followBtn.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    showToast('Please login to follow dogs', 'error');
                    return;
                }

                followBtn.disabled = true;
                const wasFollowing = followBtn.classList.contains('following');

                try {
                    if (wasFollowing) {
                        await unfollowDog(dogId);
                        updateFollowButton(followBtn, false);
                        if (followerCountEl) {
                            followerCountEl.textContent = Math.max(0, parseInt(followerCountEl.textContent) - 1);
                        }
                    } else {
                        await followDog(dogId);
                        updateFollowButton(followBtn, true);
                        if (followerCountEl) {
                            followerCountEl.textContent = parseInt(followerCountEl.textContent) + 1;
                        }
                    }
                } catch (error) {
                    console.error('Follow action failed:', error);
                    showToast('Failed to update follow status', 'error');
                } finally {
                    followBtn.disabled = false;
                }
            });
        }
    } catch (error) {
        console.error('Failed to load follow status:', error);
        // Still enable button as fallback
        if (followBtn) followBtn.disabled = false;
    }
}

/**
 * Update follow button appearance
 * @param {HTMLElement} btn - Button element
 * @param {boolean} isFollowing - Whether currently following
 */
function updateFollowButton(btn, isFollowing) {
    if (isFollowing) {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fas fa-user-check"></i> Following';
    } else {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
    }
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
 * Load dog's posts into the profile Posts tab grid
 * Uses the dog ID stored in currentDog (set by initProfile)
 */
export async function loadProfilePosts() {
    const postsGrid = document.querySelector('#posts .posts-grid');
    if (!postsGrid || !currentDog) return;

    try {
        const result = await getDogPosts(currentDog.id);

        if (!result.posts || result.posts.length === 0) {
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-camera"></i>
                    <p>No posts yet.</p>
                </div>
            `;
            return;
        }

        postsGrid.innerHTML = '';
        result.posts.forEach(post => {
            const gridItem = document.createElement('div');
            gridItem.className = 'posts-grid-item';

            const img = document.createElement('img');
            img.src = post.imageUrl;
            img.alt = post.caption || 'Post image';
            img.loading = 'lazy';
            img.onerror = function() {
                const fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23cccccc" width="300" height="300"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                if (this.src !== fallback) {
                    this.src = fallback;
                }
            };

            const overlay = document.createElement('div');
            overlay.className = 'posts-grid-overlay';
            overlay.innerHTML = `
                <span><i class="fas fa-heart"></i> ${post.likeCount || 0}</span>
            `;

            gridItem.appendChild(img);
            gridItem.appendChild(overlay);
            postsGrid.appendChild(gridItem);
        });
    } catch (error) {
        console.error('Failed to load profile posts:', error);
        postsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load posts.</p>
            </div>
        `;
    }
}

/**
 * Load health records (owner only)
 * @param {string} dogId - Dog ID
 */
export async function loadHealthRecords(dogId) {
    const healthContainer = document.querySelector('#health');
    if (!healthContainer) return;

    const isOwner = currentDog && currentDog.isOwner;

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
