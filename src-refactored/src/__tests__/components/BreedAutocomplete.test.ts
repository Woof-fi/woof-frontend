import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BreedAutocomplete from '../../components/BreedAutocomplete.svelte';

const mockBreeds = [
    { id: 'breed-1', slug: 'golden-retriever', name: 'Golden Retriever' },
    { id: 'breed-2', slug: 'german-shepherd', name: 'German Shepherd' },
    { id: 'breed-3', slug: 'golden-doodle', name: 'Goldendoodle' },
];

vi.mock('../../../js/api.js', () => ({
    searchBreeds: vi.fn().mockResolvedValue([]),
}));

describe('BreedAutocomplete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders an input with combobox role', () => {
        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[role="combobox"]');
        expect(input).not.toBeNull();
        expect(input!.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('renders placeholder text', () => {
        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;
        expect(input.placeholder).toBe('e.g., Finnish Lapphund');
    });

    it('renders hidden breed_id input', () => {
        const { container } = render(BreedAutocomplete);
        const hidden = container.querySelector('input[name="breed_id"]') as HTMLInputElement;
        expect(hidden).not.toBeNull();
        expect(hidden.type).toBe('hidden');
        expect(hidden.value).toBe('');
    });

    it('debounces search and shows dropdown on results', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue(mockBreeds);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        // Type into input
        await fireEvent.input(input, { target: { value: 'golden' } });

        // API should not be called yet (debounce)
        expect(searchBreeds).not.toHaveBeenCalled();

        // Advance past debounce timer (300ms)
        await vi.advanceTimersByTimeAsync(300);

        expect(searchBreeds).toHaveBeenCalledWith('golden');

        // Dropdown should appear
        await waitFor(() => {
            const listbox = container.querySelector('[role="listbox"]');
            expect(listbox).not.toBeNull();
        });

        // Check all results rendered
        const options = container.querySelectorAll('[role="option"]');
        expect(options.length).toBe(3);
    });

    it('does not search when input is cleared', async () => {
        const { searchBreeds } = await import('../../../js/api.js');

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: '' } });
        await vi.advanceTimersByTimeAsync(300);

        expect(searchBreeds).not.toHaveBeenCalled();
    });

    it('selects a breed on click', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue(mockBreeds);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        // Type and trigger search
        await fireEvent.input(input, { target: { value: 'golden' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Click first option
        const firstOption = container.querySelectorAll('[role="option"]')[0];
        await fireEvent.mouseDown(firstOption);

        // Input should show selected breed name
        expect(input.value).toBe('Golden Retriever');

        // Hidden input should have the breed ID
        const hidden = container.querySelector('input[name="breed_id"]') as HTMLInputElement;
        expect(hidden.value).toBe('breed-1');

        // Dropdown should close
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('navigates with arrow keys and selects with Enter', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue(mockBreeds);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        // Open dropdown
        await fireEvent.input(input, { target: { value: 'gold' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(3);
        });

        // Press ArrowDown twice to highlight second option
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await fireEvent.keyDown(input, { key: 'ArrowDown' });

        // Second option (index 1) should be highlighted
        const options = container.querySelectorAll('[role="option"]');
        expect(options[1].getAttribute('aria-selected')).toBe('true');

        // Press Enter to select
        await fireEvent.keyDown(input, { key: 'Enter' });

        // Should select German Shepherd (index 1)
        expect(input.value).toBe('German Shepherd');
        const hidden = container.querySelector('input[name="breed_id"]') as HTMLInputElement;
        expect(hidden.value).toBe('breed-2');
    });

    it('closes dropdown on Escape', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue(mockBreeds);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        // Open dropdown
        await fireEvent.input(input, { target: { value: 'gold' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelector('[role="listbox"]')).not.toBeNull();
        });

        // Press Escape
        await fireEvent.keyDown(input, { key: 'Escape' });

        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('sets aria-expanded based on dropdown state', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue(mockBreeds);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[role="combobox"]') as HTMLInputElement;

        // Initially closed
        expect(input.getAttribute('aria-expanded')).toBe('false');

        // Open dropdown
        await fireEvent.input(input, { target: { value: 'gold' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(input.getAttribute('aria-expanded')).toBe('true');
        });
    });

    it('accepts custom id prop', () => {
        const { container } = render(BreedAutocomplete, {
            props: { id: 'my-breed-input' },
        });
        const input = container.querySelector('#my-breed-input');
        expect(input).not.toBeNull();
    });

    it('supports required prop', () => {
        const { container } = render(BreedAutocomplete, {
            props: { required: true },
        });
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;
        expect(input.required).toBe(true);
    });

    it('does not show dropdown when search returns empty results', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue([]);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'zzzzz' } });
        await vi.advanceTimersByTimeAsync(300);

        // Give time for state updates
        await waitFor(() => {
            expect(container.querySelector('[role="listbox"]')).toBeNull();
        });
    });

    it('ArrowDown does not go past last item', async () => {
        const { searchBreeds } = await import('../../../js/api.js');
        vi.mocked(searchBreeds).mockResolvedValue([mockBreeds[0]]);

        const { container } = render(BreedAutocomplete);
        const input = container.querySelector('input[type="text"]') as HTMLInputElement;

        await fireEvent.input(input, { target: { value: 'gold' } });
        await vi.advanceTimersByTimeAsync(300);

        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toBe(1);
        });

        // Press ArrowDown multiple times (should stay at index 0)
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await fireEvent.keyDown(input, { key: 'ArrowDown' });

        const options = container.querySelectorAll('[role="option"]');
        expect(options[0].getAttribute('aria-selected')).toBe('true');
    });
});
