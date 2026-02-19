/**
 * Simple Client-Side Router
 * Handles navigation without page reloads
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.notFoundHandler = null;

        // Listen for navigation events
        window.addEventListener('popstate', () => this.handleRoute());

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
    }

    /**
     * Register a route handler
     * @param {string} path - Route path (e.g., '/dog/:slug')
     * @param {Function} handler - Function to call when route matches
     */
    on(path, handler) {
        this.routes.set(path, {
            pattern: this.pathToRegex(path),
            handler,
            params: this.extractParamNames(path)
        });
        return this;
    }

    /**
     * Set 404 handler
     * @param {Function} handler - Function to call when no route matches
     */
    notFound(handler) {
        this.notFoundHandler = handler;
        return this;
    }

    /**
     * Navigate to a path
     * @param {string} path - Path to navigate to
     */
    navigate(path) {
        window.history.pushState(null, null, path);
        this.handleRoute();
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Handle current route
     */
    async handleRoute() {
        const path = window.location.pathname;

        // Try to match route
        for (const [routePath, route] of this.routes) {
            const match = path.match(route.pattern);
            if (match) {
                // Extract params
                const params = {};
                route.params.forEach((paramName, index) => {
                    params[paramName] = match[index + 1];
                });

                // Call handler with params and query string
                const query = Object.fromEntries(new URLSearchParams(window.location.search));
                this.currentRoute = routePath;
                await route.handler({ params, query, path });
                window.dispatchEvent(new CustomEvent('routechange', { detail: { path } }));
                return;
            }
        }

        // No match found - call 404 handler
        if (this.notFoundHandler) {
            await this.notFoundHandler({ path });
        }
    }

    /**
     * Convert path pattern to regex
     * @param {string} path - Path pattern (e.g., '/dog/:slug')
     * @returns {RegExp} - Regular expression to match path
     */
    pathToRegex(path) {
        // Escape special regex characters except :
        const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Replace :param with capture group
        const pattern = escaped.replace(/:(\w+)/g, '([^/]+)');
        return new RegExp(`^${pattern}$`);
    }

    /**
     * Extract parameter names from path pattern
     * @param {string} path - Path pattern (e.g., '/dog/:slug')
     * @returns {string[]} - Array of parameter names
     */
    extractParamNames(path) {
        const matches = path.matchAll(/:(\w+)/g);
        return Array.from(matches, m => m[1]);
    }

    /**
     * Start the router (call after defining all routes)
     */
    start() {
        this.handleRoute();
        return this;
    }
}

// Create singleton instance
const router = new Router();

export default router;
