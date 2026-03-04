import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TerritoryDirectoryView from '../../views/TerritoryDirectoryView.svelte';

const { mockDirectoryData, mockSearchTerritories } = vi.hoisted(() => {
    const mockDirectoryData = {
        countries: [
            {
                code: 'FI',
                name: 'Finland',
                nameLocal: 'Suomi',
                municipalities: [
                    { id: 't1', slug: 'espoo', name: 'Espoo', nameFi: 'Espoo', countryCode: 'FI', dogCount: 8, urlPath: 'espoo' },
                    { id: 't2', slug: 'helsinki', name: 'Helsinki', nameFi: 'Helsinki', countryCode: 'FI', dogCount: 15, urlPath: 'helsinki' },
                    { id: 't3', slug: 'tampere', name: 'Tampere', nameFi: 'Tampere', countryCode: 'FI', dogCount: 3, urlPath: 'tampere' },
                ],
            },
        ],
        popular: [
            { id: 't2', slug: 'helsinki', name: 'Helsinki', nameFi: 'Helsinki', countryCode: 'FI', dogCount: 15, urlPath: 'helsinki' },
            { id: 't1', slug: 'espoo', name: 'Espoo', nameFi: 'Espoo', countryCode: 'FI', dogCount: 8, urlPath: 'espoo' },
        ],
        total: 3,
    };
    const mockSearchTerritories = vi.fn().mockResolvedValue([]);
    return { mockDirectoryData, mockSearchTerritories };
});

vi.mock('../../../js/api.js', () => ({
    getTerritoryDirectory: vi.fn().mockResolvedValue(mockDirectoryData),
    getFollowingTerritories: vi.fn().mockResolvedValue([]),
    searchTerritories: mockSearchTerritories,
}));

vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(false),
    getToken: vi.fn().mockReturnValue(null),
}));

vi.mock('../../../js/svelte-store.svelte.js', () => ({
    store: { authUser: null, territoryVersion: 0 },
}));

describe('TerritoryDirectoryView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders title and subtitle', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            expect(container.querySelector('h1')?.textContent).toBe('Territories');
            expect(container.querySelector('.territory-directory-subtitle')?.textContent).toBe('Explore territories and their dog communities');
        });
    });

    it('renders search bar', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const input = container.querySelector('.territory-directory-search input');
            expect(input).not.toBeNull();
        });
    });

    it('renders popular territories section', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const cards = container.querySelectorAll('.territory-popular-card');
            expect(cards.length).toBe(2); // Helsinki and Espoo
        });
    });

    it('renders alphabetical territory list', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const items = container.querySelectorAll('.territory-alpha-item');
            expect(items.length).toBe(3); // Espoo, Helsinki, Tampere
        });
    });

    it('sorts territories alphabetically by name', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const names = Array.from(container.querySelectorAll('.territory-alpha-name')).map(el => el.textContent);
            expect(names).toEqual(['Espoo', 'Helsinki', 'Tampere']);
        });
    });

    it('links to correct territory pages', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const links = Array.from(container.querySelectorAll('.territory-alpha-item'));
            expect(links[0].getAttribute('href')).toBe('/territory/espoo');
            expect(links[1].getAttribute('href')).toBe('/territory/helsinki');
        });
    });

    it('calls searchTerritories API on search input', async () => {
        mockSearchTerritories.mockResolvedValue([
            { id: 't2', name: 'Helsinki', slug: 'helsinki', type: 'municipality', urlPath: 'helsinki', parentName: null, grandparentName: null },
        ]);

        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            expect(container.querySelectorAll('.territory-alpha-item').length).toBe(3);
        });

        const input = container.querySelector('.territory-directory-search input')!;
        await fireEvent.input(input, { target: { value: 'hel' } });

        // Advance past debounce timer (250ms)
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(mockSearchTerritories).toHaveBeenCalledWith('hel');
            const items = container.querySelectorAll('.territory-alpha-item');
            expect(items.length).toBe(1);
            expect(container.querySelector('.territory-alpha-name')?.textContent).toBe('Helsinki');
        });
    });

    it('shows hierarchy context in search results', async () => {
        mockSearchTerritories.mockResolvedValue([
            { id: 'd1', name: 'Keskusta', slug: 'keskusta', type: 'district', urlPath: 'helsinki/keskusta', parentName: 'Helsinki', grandparentName: null },
            { id: 'd2', name: 'Keskusta', slug: 'keskusta', type: 'district', urlPath: 'tampere/keskusta', parentName: 'Tampere', grandparentName: null },
        ]);

        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            expect(container.querySelectorAll('.territory-alpha-item').length).toBe(3);
        });

        const input = container.querySelector('.territory-directory-search input')!;
        await fireEvent.input(input, { target: { value: 'keskusta' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            const contexts = Array.from(container.querySelectorAll('.territory-alpha-context')).map(el => el.textContent);
            expect(contexts).toEqual(['Helsinki', 'Tampere']);
        });
    });

    it('hides popular section during search', async () => {
        mockSearchTerritories.mockResolvedValue([
            { id: 't3', name: 'Tampere', slug: 'tampere', type: 'municipality', urlPath: 'tampere', parentName: null, grandparentName: null },
        ]);

        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            expect(container.querySelectorAll('.territory-popular-card').length).toBe(2);
        });

        const input = container.querySelector('.territory-directory-search input')!;
        await fireEvent.input(input, { target: { value: 'tam' } });

        await waitFor(() => {
            expect(container.querySelectorAll('.territory-popular-card').length).toBe(0);
        });
    });

    it('shows empty state when search has no results', async () => {
        mockSearchTerritories.mockResolvedValue([]);

        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            expect(container.querySelectorAll('.territory-alpha-item').length).toBe(3);
        });

        const input = container.querySelector('.territory-directory-search input')!;
        await fireEvent.input(input, { target: { value: 'zzzzz' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelector('.woof-empty-state')).not.toBeNull();
        });
    });

    it('does not show "Your Territories" when not authenticated', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const sectionTitles = Array.from(container.querySelectorAll('.territory-section-title')).map(el => el.textContent?.trim());
            const hasYourTerritories = sectionTitles.some(t => t?.includes('Your Territories'));
            expect(hasYourTerritories).toBe(false);
        });
    });

    it('shows dog count on popular cards', async () => {
        const { container } = render(TerritoryDirectoryView);
        await waitFor(() => {
            const counts = Array.from(container.querySelectorAll('.territory-popular-count')).map(el => el.textContent);
            expect(counts[0]).toBe('15 dogs');
            expect(counts[1]).toBe('8 dogs');
        });
    });
});
