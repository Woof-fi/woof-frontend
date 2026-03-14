import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsView from '../../views/SettingsView.svelte';

const { mockStore, mockOpenChangePasswordModal } = vi.hoisted(() => {
    const mockStore = {
        authUser: null as { email: string; role?: string } | null,
    };
    const mockOpenChangePasswordModal = vi.fn();
    return { mockStore, mockOpenChangePasswordModal };
});

vi.mock('../../../js/svelte-store.svelte.js', () => ({
    store: mockStore,
    setAuthUser: vi.fn(),
}));

vi.mock('../../../js/i18n-store.svelte.js', () => ({
    t: vi.fn((key: string) => key),
    locale: { current: 'en' },
    setLocale: vi.fn(),
}));

vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(false),
    logout: vi.fn(),
    getCurrentUser: vi.fn().mockReturnValue(null),
}));

vi.mock('../../../js/api.js', () => ({
    deleteMyAccount: vi.fn().mockResolvedValue(undefined),
    getMyDogs: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../js/utils.js', () => ({
    showToast: vi.fn(),
}));

vi.mock('../../../js/modal-store.svelte.js', () => ({
    openChangePasswordModal: mockOpenChangePasswordModal,
    openCreateDogModal: vi.fn(),
}));

describe('SettingsView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore.authUser = null;
    });

    it('renders login prompt when unauthenticated', () => {
        const { container } = render(SettingsView);
        expect(container.textContent).toContain('settings.loginRequired');
    });

    it('calls onopenAuthModal when login button is clicked while unauthenticated', async () => {
        const onopenAuthModal = vi.fn();
        const { getByText } = render(SettingsView, { props: { onopenAuthModal } });
        const loginBtn = getByText('nav.login');
        await fireEvent.click(loginBtn);
        expect(onopenAuthModal).toHaveBeenCalled();
    });

    it('renders all three sections when authenticated', () => {
        mockStore.authUser = { email: 'test@example.com' };
        const { container } = render(SettingsView);
        expect(container.textContent).toContain('settings.appPreferences');
        expect(container.textContent).toContain('settings.account');
        expect(container.textContent).toContain('settings.accountActions');
    });

    it('language toggle calls setLocale correctly', async () => {
        mockStore.authUser = { email: 'test@example.com' };
        const { container } = render(SettingsView);
        const langBtns = container.querySelectorAll('.lang-btn');
        expect(langBtns.length).toBe(2);

        const i18nModule = await import('../../../js/i18n-store.svelte.js');

        // Click the FI button (second)
        await fireEvent.click(langBtns[1]);
        expect(i18nModule.setLocale).toHaveBeenCalledWith('fi');

        // Click the EN button (first)
        await fireEvent.click(langBtns[0]);
        expect(i18nModule.setLocale).toHaveBeenCalledWith('en');
    });

    it('displays user email from store', () => {
        mockStore.authUser = { email: 'nelli@woofapp.fi' };
        const { container } = render(SettingsView);
        expect(container.textContent).toContain('nelli@woofapp.fi');
    });

    it('change password row opens modal', async () => {
        mockStore.authUser = { email: 'test@example.com' };
        const { getByText } = render(SettingsView);
        const changePasswordRow = getByText('settings.changePassword').closest('button')!;
        await fireEvent.click(changePasswordRow);
        expect(mockOpenChangePasswordModal).toHaveBeenCalled();
    });

    it('logout button calls logout and clears auth', async () => {
        mockStore.authUser = { email: 'test@example.com' };
        const authModule = await import('../../../js/auth.js');
        const storeModule = await import('../../../js/svelte-store.svelte.js');

        const { getByText } = render(SettingsView);
        const logoutBtn = getByText('settings.logoutBtn').closest('button')!;
        await fireEvent.click(logoutBtn);

        expect(authModule.logout).toHaveBeenCalled();
        expect(storeModule.setAuthUser).toHaveBeenCalledWith(null);
    });

    it('delete flow: reveals confirmation panel and DELETE enables button', async () => {
        mockStore.authUser = { email: 'test@example.com' };

        const { container, getByText } = render(SettingsView);

        // Initially, delete confirmation should be hidden
        expect(container.querySelector('.settings-delete-confirm')).toBeNull();

        // Click the delete account row to expand
        const deleteRow = getByText('settings.deleteAccount').closest('button')!;
        await fireEvent.click(deleteRow);

        // Confirmation panel should now be visible
        expect(container.querySelector('.settings-delete-confirm')).not.toBeNull();

        // Delete button should be disabled initially
        const deleteBtn = container.querySelector('.settings-delete-btn') as HTMLButtonElement;
        expect(deleteBtn.disabled).toBe(true);

        // Type DELETE
        const confirmInput = container.querySelector('#delete-confirm-input') as HTMLInputElement;
        await fireEvent.input(confirmInput, { target: { value: 'DELETE' } });

        // Delete button should now be enabled
        expect(deleteBtn.disabled).toBe(false);
    });

    it('delete flow: calls deleteMyAccount then logout', async () => {
        mockStore.authUser = { email: 'test@example.com' };
        const apiModule = await import('../../../js/api.js');
        const authModule = await import('../../../js/auth.js');
        vi.mocked(apiModule.deleteMyAccount).mockResolvedValue(undefined);

        const { container, getByText } = render(SettingsView);

        // Expand delete confirmation
        const deleteRow = getByText('settings.deleteAccount').closest('button')!;
        await fireEvent.click(deleteRow);

        // Type DELETE
        const confirmInput = container.querySelector('#delete-confirm-input') as HTMLInputElement;
        await fireEvent.input(confirmInput, { target: { value: 'DELETE' } });

        // Click the delete button
        const deleteBtn = container.querySelector('.settings-delete-btn') as HTMLButtonElement;
        await fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(apiModule.deleteMyAccount).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(authModule.logout).toHaveBeenCalled();
        });
    });

    it('delete flow: collapse resets confirmation text', async () => {
        mockStore.authUser = { email: 'test@example.com' };

        const { container, getByText } = render(SettingsView);

        // Expand
        const deleteRow = getByText('settings.deleteAccount').closest('button')!;
        await fireEvent.click(deleteRow);

        // Type something
        const confirmInput = container.querySelector('#delete-confirm-input') as HTMLInputElement;
        await fireEvent.input(confirmInput, { target: { value: 'DEL' } });

        // Collapse
        await fireEvent.click(deleteRow);

        // Re-expand — input should be cleared
        await fireEvent.click(deleteRow);
        const newInput = container.querySelector('#delete-confirm-input') as HTMLInputElement;
        expect(newInput.value).toBe('');
    });
});
