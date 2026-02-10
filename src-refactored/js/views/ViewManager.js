/**
 * View Manager
 * Handles rendering and lifecycle of views
 */

export class ViewManager {
    constructor(containerSelector = '#app') {
        this.container = document.querySelector(containerSelector);
        this.currentView = null;

        if (!this.container) {
            console.error(`Container ${containerSelector} not found`);
        }
    }

    /**
     * Render a view
     * @param {Object} view - View instance
     * @param {Object} params - Route parameters
     */
    async render(view, params = {}) {
        // Call onUnmount on previous view
        if (this.currentView && this.currentView.onUnmount) {
            await this.currentView.onUnmount();
        }

        // Get HTML from view
        const html = view.getHTML ? view.getHTML(params) : '';

        // Render to container
        this.container.innerHTML = html;

        // Scroll to top
        window.scrollTo(0, 0);

        // Store current view
        this.currentView = view;

        // Call onMount on new view
        if (view.onMount) {
            await view.onMount(params);
        }
    }

    /**
     * Get current view
     * @returns {Object} Current view instance
     */
    getCurrentView() {
        return this.currentView;
    }
}

export default ViewManager;
