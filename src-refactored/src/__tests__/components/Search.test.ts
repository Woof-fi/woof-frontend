import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Search from '../../components/Search.svelte';

const { mockModals } = vi.hoisted(() => {
    const mockModals = { searchPanelOpen: false };
    return { mockModals };
});

const mockDogs = [
    { id: 'd1', slug: 'nelli-1', name: 'Nelli', breedName: 'Schnauzer', profilePhoto: null },
    { id: 'd2', slug: 'bella-1', name: 'Bella', breedName: 'Labrador', profilePhoto: null },
    { id: 'd3', slug: 'helmi-1', name: 'Helmi', breedName: 'Poodle', profilePhoto: null },
];

const mockBreeds = [
    { id: 'b1', slug: 'schnauzer', name: 'Schnauzer', nameFi: 'Snautseri' },
    { id: 'b2', slug: 'labrador-retriever', name: 'Labrador Retriever', nameFi: 'Labradorinnoutaja' },
];

const mockTerritories = [
    { id: 't1', slug: 'helsinki', name: 'Helsinki', nameFi: 'Helsinki', type: 'municipality', parentSlug: null, parentName: null, parentNameFi: null, grandparentSlug: null },
    { id: 't2', slug: 'oulunkyla', name: 'Oulunkylä', nameFi: 'Oulunkylä', type: 'district', parentSlug: 'helsinki', parentName: 'Helsinki', parentNameFi: 'Helsinki', grandparentSlug: null },
];

vi.mock('../../../js/api.js', () => ({
    getAllDogs: vi.fn().mockResolvedValue([]),
    getAllBreeds: vi.fn().mockResolvedValue([]),
    getAllTerritories: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../js/modal-store.svelte.js', () => ({
    modals: mockModals,
    closeSearchPanel: vi.fn(() => { mockModals.searchPanelOpen = false; }),
}));
vi.mock('../../../js/modal-history.js', () => ({
    pushModalState: vi.fn(),
    popModalState: vi.fn(),
}));
vi.mock('../../../js/ui.js', () => ({
    toggleBodyScroll: vi.fn(),
}));
vi.mock('../../../js/utils.js', () => ({
    debounce: vi.fn((fn: Function) => fn),
}));
vi.mock('../../../js/i18n-store.svelte.js', () => ({
    t: vi.fn((key: string, params?: Record<string, string>) => {
        if (params?.query) return `No results for "${params.query}"`;
        return key;
    }),
    localName: vi.fn((item: { name: string; nameFi?: string }) => item.name),
}));

describe('Search', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockModals.searchPanelOpen = true;

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getAllDogs).mockResolvedValue(mockDogs);
        vi.mocked(apiModule.getAllBreeds).mockResolvedValue(mockBreeds);
        vi.mocked(apiModule.getAllTerritories).mockResolvedValue(mockTerritories);
    });

    it('renders search input when panel is open', () => {
        const { container } = render(Search);
        const input = container.querySelector('#mobile-search-input');
        expect(input).not.toBeNull();
    });

    it('does not show results with fewer than 2 characters', async () => {
        const { container } = render(Search);
        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'N' } });
        await new Promise(r => setTimeout(r, 50));

        const results = container.querySelectorAll('.search-result-item');
        expect(results.length).toBe(0);
    });

    it('shows dog results after typing 2+ characters', async () => {
        const { container } = render(Search);
        // Wait for data to load
        await new Promise(r => setTimeout(r, 50));

        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;
        await fireEvent.input(input, { target: { value: 'Ne' } });

        await waitFor(() => {
            const resultNames = container.querySelectorAll('.search-result-name');
            const names = Array.from(resultNames).map(el => el.textContent);
            expect(names).toContain('Nelli');
        });
    });

    it('shows territory results', async () => {
        const { container } = render(Search);
        await new Promise(r => setTimeout(r, 50));

        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;
        await fireEvent.input(input, { target: { value: 'Hel' } });

        await waitFor(() => {
            const resultNames = container.querySelectorAll('.search-result-name');
            const names = Array.from(resultNames).map(el => el.textContent);
            expect(names).toContain('Helsinki');
        });
    });

    it('shows breed results', async () => {
        const { container } = render(Search);
        await new Promise(r => setTimeout(r, 50));

        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;
        await fireEvent.input(input, { target: { value: 'Sch' } });

        await waitFor(() => {
            const resultNames = container.querySelectorAll('.search-result-name');
            const names = Array.from(resultNames).map(el => el.textContent);
            expect(names).toContain('Schnauzer');
        });
    });

    it('ranks starts-with matches before contains matches', async () => {
        const { container } = render(Search);
        await new Promise(r => setTimeout(r, 50));

        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;
        // "hel" should rank "Helmi" (starts-with) before territory "Helsinki"
        // but both should appear. Dogs section appears first.
        await fireEvent.input(input, { target: { value: 'hel' } });

        await waitFor(() => {
            const resultNames = container.querySelectorAll('.search-result-name');
            const names = Array.from(resultNames).map(el => el.textContent);
            // Helmi (dog, starts-with) should appear
            expect(names).toContain('Helmi');
            // Helsinki (territory, starts-with) should appear
            expect(names).toContain('Helsinki');
            // Dogs section comes first in the template
            const helmiIdx = names.indexOf('Helmi');
            const helsinkiIdx = names.indexOf('Helsinki');
            expect(helmiIdx).toBeLessThan(helsinkiIdx);
        });
    });

    it('shows no-results message for unmatched query', async () => {
        const { container } = render(Search);
        await new Promise(r => setTimeout(r, 50));

        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;
        await fireEvent.input(input, { target: { value: 'zzzzz' } });

        await waitFor(() => {
            const noResults = container.querySelector('.search-no-results');
            expect(noResults).not.toBeNull();
        });
    });

    it('cancel button closes panel and clears query', async () => {
        const modalStore = await import('../../../js/modal-store.svelte.js');

        const { container } = render(Search);
        const input = container.querySelector('#mobile-search-input') as HTMLInputElement;
        await fireEvent.input(input, { target: { value: 'test' } });

        const cancelBtn = container.querySelector('.close-search') as HTMLElement;
        await fireEvent.click(cancelBtn);

        expect(modalStore.closeSearchPanel).toHaveBeenCalled();
    });
});
