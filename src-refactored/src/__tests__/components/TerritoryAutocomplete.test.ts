import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TerritoryAutocomplete from '../../components/TerritoryAutocomplete.svelte';

const mockSearchResults = [
    { id: 't-1', name: 'Helsinki', type: 'municipality', hasChildren: true, parentName: null, grandparentName: null },
    { id: 't-2', name: 'Kallio', type: 'district', hasChildren: false, parentName: 'Helsinki', grandparentName: null },
    { id: 't-3', name: 'Oulunkylä', type: 'district', hasChildren: true, parentName: 'Helsinki', grandparentName: null },
];

const mockChildren = [
    { id: 't-4', name: 'Patola', type: 'sub_district', hasChildren: false, parentName: 'Oulunkylä', grandparentName: 'Helsinki' },
    { id: 't-5', name: 'Veräjämäki', type: 'sub_district', hasChildren: false, parentName: 'Oulunkylä', grandparentName: 'Helsinki' },
];

vi.mock('../../../js/api.js', () => ({
    searchTerritories: vi.fn().mockResolvedValue([]),
    browseTerritoryChildren: vi.fn().mockResolvedValue([]),
}));

describe('TerritoryAutocomplete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders an input with combobox role and placeholder', () => {
        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[role="combobox"]') as HTMLInputElement;
        expect(input).not.toBeNull();
        expect(input.placeholder).toBe('e.g., Kallio, Helsinki');
        expect(input.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('renders hidden territory_id input', () => {
        const { container } = render(TerritoryAutocomplete);
        const hidden = container.querySelector('input[name="territory_id"]') as HTMLInputElement;
        expect(hidden).not.toBeNull();
        expect(hidden.type).toBe('hidden');
        expect(hidden.value).toBe('');
    });

    it('debounces search and shows dropdown on results', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'helsinki' } });

        // API should not be called yet (debounce)
        expect(searchTerritories).not.toHaveBeenCalled();

        // Advance past debounce timer (300ms)
        await vi.advanceTimersByTimeAsync(300);

        expect(searchTerritories).toHaveBeenCalledWith('helsinki');

        // Dropdown should appear
        await waitFor(() => {
            const listbox = container.querySelector('[role="listbox"]');
            expect(listbox).not.toBeNull();
        });

        const options = container.querySelectorAll('[role="option"]');
        expect(options.length).toBe(3);
    });

    it('shows drill-down indicator on non-leaf territories', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'hel' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Helsinki (hasChildren=true) should have chevron-right icon
        const options = container.querySelectorAll('[role="option"]');
        const helsinkiOption = options[0];
        expect(helsinkiOption.querySelector('.fa-chevron-right')).not.toBeNull();

        // Kallio (hasChildren=false) should NOT have chevron-right
        const kallioOption = options[1];
        expect(kallioOption.querySelector('.fa-chevron-right')).toBeNull();
    });

    it('clicking leaf territory selects it', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'kallio' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Click Kallio (leaf district, index 1)
        const kallioOption = container.querySelectorAll('[role="option"]')[1];
        await fireEvent.mouseDown(kallioOption);

        // Input should show formatted display name: "Kallio, Helsinki"
        expect(input.value).toBe('Kallio, Helsinki');

        // Hidden input should have the territory ID
        const hidden = container.querySelector('input[name="territory_id"]') as HTMLInputElement;
        expect(hidden.value).toBe('t-2');

        // Dropdown should close
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('clicking non-leaf territory enters browse mode', async () => {
        const { searchTerritories, browseTerritoryChildren } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);
        vi.mocked(browseTerritoryChildren).mockResolvedValue(mockChildren);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'oulun' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Click Oulunkylä (non-leaf, index 2)
        const oulunkylaOption = container.querySelectorAll('[role="option"]')[2];
        await fireEvent.mouseDown(oulunkylaOption);

        // Should call browseTerritoryChildren
        expect(browseTerritoryChildren).toHaveBeenCalledWith('t-3');

        // Should show children + back button
        await waitFor(() => {
            const backBtn = container.querySelector('.territory-back');
            expect(backBtn).not.toBeNull();
        });

        const options = container.querySelectorAll('[role="option"]');
        // Back button + 2 children
        expect(options.length).toBeGreaterThanOrEqual(2);
    });

    it('formats display name with full breadcrumb for sub_district', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockChildren);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'patola' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(2);
        });

        // Click Patola (sub_district)
        const patolaOption = container.querySelectorAll('[role="option"]')[0];
        await fireEvent.mouseDown(patolaOption);

        // Should format as "Patola, Oulunkylä, Helsinki"
        expect(input.value).toBe('Patola, Oulunkylä, Helsinki');
    });

    it('closes dropdown on Escape', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'hel' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelector('[role="listbox"]')).not.toBeNull();
        });

        await fireEvent.keyDown(input, { key: 'Escape' });

        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('navigates with arrow keys and selects with Enter', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'hel' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Press ArrowDown twice to highlight Kallio (leaf, index 1)
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await fireEvent.keyDown(input, { key: 'ArrowDown' });

        const options = container.querySelectorAll('[role="option"]');
        expect(options[1].getAttribute('aria-selected')).toBe('true');

        // Press Enter to select Kallio
        await fireEvent.keyDown(input, { key: 'Enter' });

        expect(input.value).toBe('Kallio, Helsinki');
    });

    it('does not search when input is cleared', async () => {
        const { searchTerritories } = await import('../../../js/api.js');

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: '' } });
        await vi.advanceTimersByTimeAsync(300);

        expect(searchTerritories).not.toHaveBeenCalled();
    });

    it('accepts custom id prop', () => {
        const { container } = render(TerritoryAutocomplete, {
            props: { id: 'my-territory' },
        });
        const input = container.querySelector('#my-territory');
        expect(input).not.toBeNull();
    });

    it('shows context info in search mode', async () => {
        const { searchTerritories } = await import('../../../js/api.js');
        vi.mocked(searchTerritories).mockResolvedValue(mockSearchResults);

        const { container } = render(TerritoryAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'hel' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Kallio should show "Helsinki" as context
        const contextElements = container.querySelectorAll('.territory-option-context');
        const contexts = Array.from(contextElements).map(el => el.textContent);
        expect(contexts).toContain('Helsinki');
    });
});
