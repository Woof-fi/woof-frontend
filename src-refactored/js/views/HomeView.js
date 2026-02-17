/**
 * Home View
 * Main feed page with For You / Following tabs
 */

import { initFeed, initFeedTabs } from '../posts.js';

export class HomeView {
    constructor() {
        this.name = 'home';
    }

    /**
     * Render the home view
     * @returns {string} HTML content
     */
    getHTML() {
        return `
            <main>
                <!-- Feed Tabs -->
                <div class="feed-tabs" role="tablist">
                    <button class="feed-tab active" data-feed-type="public" role="tab" aria-selected="true">
                        For You
                    </button>
                    <button class="feed-tab" data-feed-type="following" role="tab" aria-selected="false">
                        Following
                    </button>
                </div>

                <!-- Feed Section -->
                <section class="feed">
                    <div id="feed-container" class="feed-container" role="feed" aria-label="Dog posts feed">
                        <!-- Posts will be loaded here by posts.js -->
                    </div>
                </section>
            </main>
        `;
    }

    /**
     * Called after view is rendered to DOM
     */
    async onMount() {
        // Set up tab switching
        initFeedTabs();
        // Load initial feed (public/For You)
        initFeed('public');
    }

    /**
     * Called before view is removed from DOM
     */
    onUnmount() {
        // Cleanup if needed
    }
}

export default new HomeView();
