/**
 * Search Module Tests
 * Tests for search result rendering and SPA-compatible link format
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock API module before importing search
vi.mock('../../js/api.js', () => ({
  getAllDogs: vi.fn(),
}));

// Mock UI module
vi.mock('../../js/ui.js', () => ({
  toggleBodyScroll: vi.fn(),
  focusFirstElement: vi.fn(),
}));

import { initSearch, clearRecentSearches } from '../../js/search.js';
import { getAllDogs } from '../../js/api.js';

const mockDogs = [
  { id: 'id-1', slug: 'nelli-1', name: 'Nelli', breed: 'Pomeranian', profilePhoto: '/photos/nelli.jpg' },
  { id: 'id-2', slug: 'luna-2', name: 'Luna', breed: 'Labrador', profilePhoto: '/photos/luna.jpg' },
  { id: 'id-3', slug: 'max-3', name: 'Max', breed: 'Pomeranian', profilePhoto: null },
];

function setupSearchDOM() {
  document.body.innerHTML = `
    <div id="search-panel" aria-hidden="true">
      <input id="mobile-search-input" type="text" />
      <button class="close-search">Close</button>
      <ul id="search-results"></ul>
    </div>
    <input id="desktop-search-input" type="text" />
    <button id="desktop-search-button">Search</button>
  `;
}

describe('Search Module', () => {
  beforeEach(() => {
    setupSearchDOM();
    vi.mocked(getAllDogs).mockResolvedValue(mockDogs);
  });

  describe('initSearch and search result rendering', () => {
    it('should load dogs from API on init', async () => {
      initSearch();
      // Wait for loadSearchData to complete
      await vi.waitFor(() => {
        expect(getAllDogs).toHaveBeenCalledOnce();
      });
    });

    it('should render search results with SPA-compatible /dog/:slug links', async () => {
      initSearch();
      await vi.waitFor(() => expect(getAllDogs).toHaveBeenCalled());

      // Simulate typing in search input
      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      searchInput.value = 'Nelli';
      searchInput.dispatchEvent(new Event('input'));

      // Debounce is 300ms, wait for it
      await vi.waitFor(() => {
        const results = document.getElementById('search-results');
        expect(results?.children.length).toBeGreaterThan(0);
      }, { timeout: 500 });

      const link = document.querySelector('#search-results a') as HTMLAnchorElement;
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/dog/nelli-1');
      expect(link.hasAttribute('data-link')).toBe(true);
    });

    it('should NOT use nelli.html links', async () => {
      initSearch();
      await vi.waitFor(() => expect(getAllDogs).toHaveBeenCalled());

      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      searchInput.value = 'Nelli';
      searchInput.dispatchEvent(new Event('input'));

      await vi.waitFor(() => {
        const results = document.getElementById('search-results');
        expect(results?.children.length).toBeGreaterThan(0);
      }, { timeout: 500 });

      const links = document.querySelectorAll('#search-results a');
      links.forEach(link => {
        expect(link.getAttribute('href')).not.toContain('nelli.html');
      });
    });

    it('should fall back to id when slug is missing', async () => {
      const dogsWithoutSlug = [
        { id: 'id-99', slug: undefined, name: 'Buddy', breed: 'Beagle', profilePhoto: null },
      ];
      vi.mocked(getAllDogs).mockResolvedValue(dogsWithoutSlug);

      initSearch();
      await vi.waitFor(() => expect(getAllDogs).toHaveBeenCalled());

      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      searchInput.value = 'Buddy';
      searchInput.dispatchEvent(new Event('input'));

      await vi.waitFor(() => {
        const results = document.getElementById('search-results');
        expect(results?.children.length).toBeGreaterThan(0);
      }, { timeout: 500 });

      const link = document.querySelector('#search-results a') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/dog/id-99');
    });

    it('should filter results by breed', async () => {
      initSearch();
      await vi.waitFor(() => expect(getAllDogs).toHaveBeenCalled());

      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      searchInput.value = 'Pomeranian';
      searchInput.dispatchEvent(new Event('input'));

      await vi.waitFor(() => {
        const results = document.getElementById('search-results');
        expect(results?.children.length).toBe(2); // Nelli and Max
      }, { timeout: 500 });
    });

    it('should show no results message for unmatched query', async () => {
      initSearch();
      await vi.waitFor(() => expect(getAllDogs).toHaveBeenCalled());

      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      searchInput.value = 'Zzzznonexistent';
      searchInput.dispatchEvent(new Event('input'));

      await vi.waitFor(() => {
        const noResults = document.querySelector('.search-no-results');
        expect(noResults).not.toBeNull();
      }, { timeout: 500 });
    });

    it('should use default image when profilePhoto is null', async () => {
      initSearch();
      await vi.waitFor(() => expect(getAllDogs).toHaveBeenCalled());

      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      searchInput.value = 'Max';
      searchInput.dispatchEvent(new Event('input'));

      await vi.waitFor(() => {
        const results = document.getElementById('search-results');
        expect(results?.children.length).toBeGreaterThan(0);
      }, { timeout: 500 });

      const img = document.querySelector('#search-results img') as HTMLImageElement;
      expect(img.src).toContain('/assets/images/default-dog.jpg');
    });
  });

  describe('clearRecentSearches', () => {
    it('should remove recentSearches from localStorage', () => {
      localStorage.setItem('recentSearches', JSON.stringify([{ id: '1', name: 'Test' }]));
      clearRecentSearches();
      expect(localStorage.getItem('recentSearches')).toBeNull();
    });

    it('should clear the results container', () => {
      const results = document.getElementById('search-results');
      if (results) results.innerHTML = '<li>old result</li>';

      clearRecentSearches();
      expect(results?.innerHTML).toBe('');
    });
  });
});
