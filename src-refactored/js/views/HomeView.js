/**
 * Home View
 * Main feed page
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
                <!-- Feed Section -->
                <section class="feed">
                    <div class="feed-tabs">
                        <button class="feed-tab active" data-feed-type="public" aria-selected="true">
                            <i class="fas fa-globe"></i>
                            Public
                        </button>
                        <button class="feed-tab" data-feed-type="following" aria-selected="false">
                            <i class="fas fa-users"></i>
                            Following
                        </button>
                    </div>

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
        // Initialize feed functionality
        initFeed();
        initFeedTabs();
    }

    /**
     * Called before view is removed from DOM
     */
    onUnmount() {
        // Cleanup if needed
    }
}

export default new HomeView();
