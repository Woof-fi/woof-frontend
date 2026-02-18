/**
 * Profile View
 * Dog profile page (handles any dog slug)
 */

import { initProfile, initProfileTabs, loadProfilePosts, loadGallery, loadFriends, loadHealthRecords } from '../profile.js';

export class ProfileView {
    constructor() {
        this.name = 'profile';
        this.currentSlug = null;
    }

    /**
     * Render the profile view
     * @param {Object} params - Route parameters
     * @returns {string} HTML content
     */
    getHTML(data = {}) {
        this.currentSlug = data.params?.slug || 'nelli-1';

        return `
            <main>
                <!-- Profile content will be loaded by profile.js -->
                <div class="profile-container" data-dog-slug="${this.currentSlug}">
                    <!-- Profile skeleton/loading will be shown initially -->
                </div>

                <!-- Profile Tabs -->
                <div class="profile-tabs" role="tablist">
                    <button class="tab-link active" data-tab="posts" role="tab" aria-selected="true">
                        <i class="fas fa-images"></i>
                        Posts
                    </button>
                    <button class="tab-link" data-tab="gallery" role="tab" aria-selected="false">
                        <i class="fas fa-camera"></i>
                        Gallery
                    </button>
                    <button class="tab-link" data-tab="friends" role="tab" aria-selected="false">
                        <i class="fas fa-user-friends"></i>
                        Friends
                    </button>
                    <button class="tab-link" data-tab="health" role="tab" aria-selected="false">
                        <i class="fas fa-heartbeat"></i>
                        Health
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="tab-content active" id="posts" role="tabpanel" aria-hidden="false">
                    <div class="posts-grid">
                        <!-- Posts will be loaded here -->
                    </div>
                </div>

                <div class="tab-content" id="gallery" role="tabpanel" aria-hidden="true">
                    <div class="gallery">
                        <!-- Gallery will be loaded here -->
                    </div>
                </div>

                <div class="tab-content" id="friends" role="tabpanel" aria-hidden="true">
                    <div class="friend-list">
                        <!-- Friends will be loaded here -->
                    </div>
                </div>

                <div class="tab-content" id="health" role="tabpanel" aria-hidden="true">
                    <!-- Health records will be loaded here -->
                </div>
            </main>
        `;
    }

    /**
     * Called after view is rendered to DOM
     * @param {Object} params - Route parameters
     */
    async onMount(data = {}) {
        const slug = data.params?.slug || 'nelli-1';

        // Initialize profile with slug
        // Note: We'll need to update initProfile to accept slug instead of ID
        await initProfile(slug);
        initProfileTabs();

        // Load tab content
        loadProfilePosts();
        loadGallery(slug);
        loadFriends(slug);
        loadHealthRecords(slug);
    }

    /**
     * Called before view is removed from DOM
     */
    onUnmount() {
        // Cleanup if needed
    }
}

export default new ProfileView();
