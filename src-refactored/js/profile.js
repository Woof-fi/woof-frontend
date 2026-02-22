/**
 * Profile — coordinator module
 *
 * Delegates implementation to focused sub-modules:
 *   profile-follow.js  — follow/unfollow button, message button, counts
 *   profile-health.js  — health records tab
 *   profile-social.js  — friends (mutual follows) tab
 *
 * This module owns: profile skeleton, tab wiring, posts grid, currentDog state.
 */

import { getDog, getDogBySlug, getDogPosts } from './api.js';
import { showError, showProfileSkeleton } from './ui.js';
import { escapeHTML } from './utils.js';
/**
 * Open edit dog modal via window event (dispatched to EditDogModal.svelte)
 */
function openEditDogModal(dog, callback) {
    window.dispatchEvent(new CustomEvent('openEditDogModal', { detail: dog }));
    if (callback) {
        window.addEventListener('profile-refresh', callback, { once: true });
    }
}
import { showOnboardingTour, isOnboardingCompleted } from './onboarding-tour.js';
import { initFollowSection, loadFollowerCount, loadFollowingCount as _loadFollowingCount } from './profile-follow.js';
import { loadHealthRecords } from './profile-health.js';
import { loadFriends } from './profile-social.js';

// Current dog data — shared with sub-modules via exported getter
let currentDog = null;

export function getCurrentDog() { return currentDog; }

/**
 * Initialize profile page
 * @param {string} slugOrId - Dog slug (e.g., 'nelli-1') or UUID
 */
export async function initProfile(slugOrId) {
    const profileContainer = document.querySelector('.profile-container') || document.querySelector('.profile');
    if (!profileContainer) return;

    try {
        showProfileSkeleton(profileContainer);

        const dog = slugOrId.includes('-')
            ? await getDogBySlug(slugOrId)
            : await getDog(slugOrId);

        currentDog = dog;
        renderProfile(dog, profileContainer, slugOrId);

        if (dog.isOwner && !isOnboardingCompleted()) {
            setTimeout(() => showOnboardingTour(dog.name), 500);
        }
    } catch (error) {
        showError(profileContainer, 'Failed to load profile', () => initProfile(slugOrId));
    }
}

/**
 * @private Render dog profile sheet
 */
function renderProfile(dog, container, slugOrId) {
    const name = escapeHTML(dog.name);
    const breed = escapeHTML(dog.breed);
    const bio = dog.bio ? escapeHTML(dog.bio) : null;

    const profilePhoto = dog.profilePhoto || '/images/dog_profile_pic.jpg';

    const heroEl = document.getElementById('profile-hero');
    if (heroEl) {
        heroEl.innerHTML = `
            <img src="${profilePhoto}"
                 alt="${name}"
                 class="profile-hero-img"
                 onerror="if(this.src!=='/images/dog_profile_pic.jpg') this.src='/images/dog_profile_pic.jpg'">
        `;
    }

    const nameRowAction = dog.isOwner
        ? `<button class="edit-profile-btn" id="edit-profile-btn"><i class="fas fa-edit"></i> Edit</button>`
        : '';

    container.innerHTML = `
        <div class="profile-sheet-namerow">
            <div>
                <div class="profile-sheet-name">${name}</div>
                <div class="profile-sheet-breed"><i class="fas fa-paw"></i> ${breed}</div>
            </div>
            ${nameRowAction}
        </div>
        <div class="profile-sheet-stats">
            <div class="profile-sheet-stat">
                <div class="profile-sheet-stat-num" id="post-count">—</div>
                <div class="profile-sheet-stat-label">Posts</div>
            </div>
            <div class="profile-sheet-stat">
                <div class="profile-sheet-stat-num" id="follower-count">—</div>
                <div class="profile-sheet-stat-label">Followers</div>
            </div>
            <div class="profile-sheet-stat">
                <div class="profile-sheet-stat-num" id="following-count">—</div>
                <div class="profile-sheet-stat-label">Following</div>
            </div>
        </div>
        ${bio ? `<p class="profile-sheet-bio">${bio}</p>` : ''}
    `;

    if (dog.isOwner) {
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => openEditDogModal(dog, () => initProfile(slugOrId)));
        }
        // Owner: load counts directly
        loadFollowerCount(dog.id);
    } else {
        // Non-owner: render follow + message sticky footer
        initFollowSection(dog);
    }
}

/**
 * Initialize profile tabs (Posts / Friends / Health)
 */
export function initProfileTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            tabLinks.forEach(l => {
                l.classList.remove('active');
                l.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-hidden', 'true');
            });

            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');

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
 * Load the following count for the current dog.
 * Called from ProfileView.onMount after initProfile resolves.
 */
export async function loadFollowingCount() {
    if (currentDog?.id) {
        await _loadFollowingCount(currentDog.id);
    }
}

/**
 * Load dog's posts into the profile Posts tab grid
 */
export async function loadProfilePosts() {
    const postsGrid = document.querySelector('#posts .posts-grid');
    if (!postsGrid || !currentDog) return;

    try {
        const result = await getDogPosts(currentDog.id);

        if (!result.posts || result.posts.length === 0) {
            const postCountEl = document.getElementById('post-count');
            if (postCountEl) postCountEl.textContent = '0';
            const isOwner = currentDog?.isOwner;
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-camera"></i>
                    <p>${isOwner ? 'No posts yet. Share your first photo!' : 'No posts yet.'}</p>
                </div>
            `;
            return;
        }

        const postCountEl = document.getElementById('post-count');
        if (postCountEl) postCountEl.textContent = result.posts.length;

        postsGrid.innerHTML = '';
        result.posts.forEach(post => {
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
            overlay.innerHTML = `<span><i class="fas fa-heart"></i> ${post.likeCount || 0}</span>`;

            const link = document.createElement('a');
            link.href = `/post/${post.id}`;
            link.setAttribute('data-link', '');
            link.className = 'posts-grid-item';

            link.appendChild(img);
            link.appendChild(overlay);
            postsGrid.appendChild(link);
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

// Re-export sub-module public API so callers that import from profile.js still work
export { loadHealthRecords } from './profile-health.js';
export { loadFriends } from './profile-social.js';
