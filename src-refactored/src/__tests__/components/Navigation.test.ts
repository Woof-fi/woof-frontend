import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navigation from '../../components/Navigation.svelte';

const { mockStore } = vi.hoisted(() => {
    const mockStore = {
        authUser: null as { id: string; role: string } | null,
        feedTab: 'public',
        dogVersion: 0,
        breedVersion: 0,
        territoryVersion: 0,
        notifUnreadCount: 0,
    };
    return { mockStore };
});

const oneDog = [{ id: 'dog-1', name: 'Nelli', slug: 'nelli-1', displayId: 1, profilePhoto: null }];
const mockBreeds = [
    { id: 'b1', slug: 'schnauzer', name: 'Schnauzer', nameFi: 'Snautseri' },
];
const mockTerritories = [
    { id: 't1', slug: 'helsinki', name: 'Helsinki', nameFi: 'Helsinki', urlPath: 'helsinki' },
];

vi.mock('../../../js/api.js', () => ({
    getMyDogs: vi.fn().mockResolvedValue([]),
    getUnreadCount: vi.fn().mockResolvedValue({ unreadCount: 0 }),
    getNotifUnreadCount: vi.fn().mockResolvedValue({ unreadCount: 0 }),
    getFollowingBreeds: vi.fn().mockResolvedValue([]),
    getFollowingTerritories: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(false),
    logout: vi.fn(),
}));
vi.mock('../../../js/modal-store.svelte.js', () => ({
    openCreateDogModal: vi.fn(),
    openSearchPanel: vi.fn(),
}));
vi.mock('../../../js/svelte-store.svelte.js', () => ({
    store: mockStore,
    setAuthUser: vi.fn(),
    setFeedTab: vi.fn(),
    setNotifUnreadCount: vi.fn(),
    setCurrentDog: vi.fn(),
    setUserDogIds: vi.fn(),
}));
vi.mock('../../../js/i18n-store.svelte.js', () => ({
    t: vi.fn((key: string) => key),
    localName: vi.fn((item: { name: string }) => item.name),
    locale: { current: 'en' },
    setLocale: vi.fn(),
}));

describe('Navigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore.authUser = null;
        mockStore.feedTab = 'public';
        mockStore.notifUnreadCount = 0;
    });

    it('renders header with logo', () => {
        const { container } = render(Navigation);
        const logo = container.querySelector('.header-logo-desktop img');
        expect(logo).not.toBeNull();
        expect((logo as HTMLImageElement).alt).toBe('Woof Logo');
    });

    it('shows login text when unauthenticated', () => {
        const { container } = render(Navigation);
        const footer = container.querySelector('.nav-drawer-footer');
        expect(footer?.textContent).toContain('nav.login');
    });

    it('shows dog profile link when user has dogs', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);
        mockStore.authUser = { id: 'user-1', role: 'user' };

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);

        const { container } = render(Navigation);

        await waitFor(() => {
            const links = container.querySelectorAll('.nav-drawer-links a');
            const linkTexts = Array.from(links).map(l => l.textContent?.trim());
            expect(linkTexts.some(t => t?.includes('Nelli'))).toBe(true);
        });
    });

    it('shows followed breeds in drawer', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);
        mockStore.authUser = { id: 'user-1', role: 'user' };

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);
        vi.mocked(apiModule.getFollowingBreeds).mockResolvedValue(mockBreeds);

        const { container } = render(Navigation);

        await waitFor(() => {
            const sectionLabels = container.querySelectorAll('.nav-drawer-section-label');
            const labels = Array.from(sectionLabels).map(l => l.textContent);
            expect(labels).toContain('nav.breeds');
        });

        await waitFor(() => {
            const breedLinks = container.querySelectorAll('.nav-drawer-section .nav-drawer-row');
            const linkTexts = Array.from(breedLinks).map(l => l.textContent?.trim());
            expect(linkTexts.some(t => t?.includes('Schnauzer'))).toBe(true);
        });
    });

    it('shows followed territories in drawer', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);
        mockStore.authUser = { id: 'user-1', role: 'user' };

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);
        vi.mocked(apiModule.getFollowingTerritories).mockResolvedValue(mockTerritories);

        const { container } = render(Navigation);

        await waitFor(() => {
            const sectionLabels = container.querySelectorAll('.nav-drawer-section-label');
            const labels = Array.from(sectionLabels).map(l => l.textContent);
            expect(labels).toContain('nav.territories');
        });

        await waitFor(() => {
            const rows = container.querySelectorAll('.nav-drawer-section .nav-drawer-row');
            const rowTexts = Array.from(rows).map(r => r.textContent?.trim());
            expect(rowTexts.some(t => t?.includes('Helsinki'))).toBe(true);
        });
    });

    it('language toggle calls setLocale', async () => {
        const i18nModule = await import('../../../js/i18n-store.svelte.js');

        const { container } = render(Navigation);
        const langBtns = container.querySelectorAll('.lang-btn');
        expect(langBtns.length).toBe(2);

        // Click the second button (FI)
        await fireEvent.click(langBtns[1]);
        expect(i18nModule.setLocale).toHaveBeenCalledWith('fi');
    });

    it('renders bottom nav with home, search, create, profile', () => {
        const { container } = render(Navigation);
        const bottomNav = container.querySelector('.bottom-nav');
        expect(bottomNav).not.toBeNull();

        const homeLink = container.querySelector('#bottom-nav-home');
        const searchBtn = container.querySelector('#bottom-nav-search');
        const createBtn = container.querySelector('#create-post-link-mobile');
        const profileLink = container.querySelector('#bottom-nav-profile');

        expect(homeLink).not.toBeNull();
        expect(searchBtn).not.toBeNull();
        expect(createBtn).not.toBeNull();
        expect(profileLink).not.toBeNull();
    });
});
