/**
 * Search Functionality
 * Handles search panel, predictive search, and results
 */

import { getAllDogs } from './api.js';
import { debounce, escapeHTML } from './utils.js';
import { toggleBodyScroll, focusFirstElement } from './ui.js';
import { pushModalState, popModalState } from './modals.js';

let searchCache = [];

/**
 * Initialize search functionality
 */
export function initSearch() {
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('mobile-search-input');
    const desktopSearchInput = document.getElementById('desktop-search-input');
    const desktopSearchButton = document.getElementById('desktop-search-button');
    const closeSearchBtn = document.querySelector('.close-search');
    const searchResults = document.getElementById('search-results');

    if (!searchPanel) return;

    // Load search data
    loadSearchData();

    // Desktop search button click
    if (desktopSearchButton) {
        desktopSearchButton.addEventListener('click', (e) => {
            e.preventDefault();
            openSearchPanel();
        });
    }

    // Desktop search input focus
    if (desktopSearchInput) {
        desktopSearchInput.addEventListener('focus', openSearchPanel);
    }

    // Close button
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', closeSearchPanel);
    }

    // Click outside to close
    searchPanel.addEventListener('click', (e) => {
        if (e.target === searchPanel) {
            closeSearchPanel();
        }
    });

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value, searchResults);
        }, 300));
    }

    // Click on result
    if (searchResults) {
        searchResults.addEventListener('click', (e) => {
            const resultItem = e.target.closest('li');
            if (resultItem) {
                closeSearchPanel();
            }
        });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchPanel.classList.contains('active')) {
            closeSearchPanel();
        }
    });
}

/**
 * Open search panel
 */
export function openSearchPanel() {
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('mobile-search-input');

    if (!searchPanel) return;

    searchPanel.classList.add('active');
    searchPanel.setAttribute('aria-hidden', 'false');
    toggleBodyScroll(true);
    pushModalState();

    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }
}

/**
 * Close search panel
 */
function closeSearchPanel() {
    const searchPanel = document.getElementById('search-panel');
    if (!searchPanel || !searchPanel.classList.contains('active')) return;

    searchPanel.classList.remove('active');
    searchPanel.setAttribute('aria-hidden', 'true');
    toggleBodyScroll(false);
    popModalState();

    // Clear search input
    const searchInput = document.getElementById('mobile-search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    // Clear results
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.innerHTML = '';
    }
}

/**
 * Load search data from API
 */
async function loadSearchData() {
    try {
        const dogs = await getAllDogs();
        searchCache = dogs.map(dog => ({
            id: dog.id,
            slug: dog.slug,
            name: dog.name,
            breed: dog.breed,
            profilePhoto: dog.profilePhoto
        }));
    } catch (error) {
        console.error('Failed to load search data:', error);
        searchCache = [];
    }
}

/**
 * Handle search query
 * @param {string} query - Search query
 * @param {HTMLElement} resultsContainer - Results container
 */
function handleSearch(query, resultsContainer) {
    if (!resultsContainer) return;

    // Clear if empty query
    if (!query.trim()) {
        resultsContainer.innerHTML = '';
        return;
    }

    // Filter results
    const lowerQuery = query.toLowerCase();
    const results = searchCache.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.breed.toLowerCase().includes(lowerQuery)
    );

    // Render results
    renderSearchResults(results, resultsContainer, query);
}

/**
 * Render search results
 * @param {object[]} results - Search results
 * @param {HTMLElement} container - Results container
 * @param {string} query - Original query for highlighting
 */
function renderSearchResults(results, container, query) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = `
            <li class="search-no-results">
                <span>No results found for "${escapeHTML(query)}"</span>
            </li>
        `;
        return;
    }

    results.forEach(result => {
        const li = document.createElement('li');
        li.className = 'search-result-item';

        const link = document.createElement('a');
        link.href = `/dog/${result.slug || result.id}`;
        link.setAttribute('data-link', '');
        link.className = 'search-result-link';

        const img = document.createElement('img');
        img.src = result.profilePhoto || '/assets/images/dog_profile_pic.jpg';
        img.alt = escapeHTML(result.name);
        img.className = 'search-result-avatar';
        img.loading = 'lazy';
        img.onerror = function() {
            this.src = '/assets/images/dog_profile_pic.jpg';
        };

        const textContainer = document.createElement('div');
        textContainer.className = 'search-result-text';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'search-result-name';
        nameSpan.textContent = result.name;

        const breedSpan = document.createElement('span');
        breedSpan.className = 'search-result-breed';
        breedSpan.textContent = result.breed;

        textContainer.appendChild(nameSpan);
        textContainer.appendChild(breedSpan);

        link.appendChild(img);
        link.appendChild(textContainer);
        li.appendChild(link);

        container.appendChild(li);
    });
}

/**
 * Get recent searches from localStorage
 * @returns {object[]} - Recent searches
 */
function getRecentSearches() {
    try {
        const recent = localStorage.getItem('recentSearches');
        return recent ? JSON.parse(recent) : [];
    } catch (error) {
        console.error('Failed to load recent searches:', error);
        return [];
    }
}

/**
 * Save recent search to localStorage
 * @param {object} item - Search item to save
 */
function saveRecentSearch(item) {
    try {
        let recent = getRecentSearches();

        // Remove if already exists
        recent = recent.filter(r => r.id !== item.id);

        // Add to beginning
        recent.unshift(item);

        // Keep only last 10
        recent = recent.slice(0, 10);

        localStorage.setItem('recentSearches', JSON.stringify(recent));
    } catch (error) {
        console.error('Failed to save recent search:', error);
    }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches() {
    try {
        localStorage.removeItem('recentSearches');
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to clear recent searches:', error);
    }
}
