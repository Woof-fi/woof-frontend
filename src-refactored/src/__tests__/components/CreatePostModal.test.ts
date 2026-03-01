import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreatePostModal from '../../components/CreatePostModal.svelte';

// Mock URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-preview');
global.URL.revokeObjectURL = vi.fn();

// vi.hoisted runs before vi.mock factories, making this variable available
const { mockModals } = vi.hoisted(() => {
    const mockModals = { createPostModalOpen: false };
    return { mockModals };
});

vi.mock('../../../js/api.js', () => ({
    getMyDogs: vi.fn().mockResolvedValue([]),
    createPost: vi.fn().mockResolvedValue({ id: 'post-1' }),
    uploadImage: vi.fn().mockResolvedValue('https://cdn.woofapp.fi/posts/test.jpg'),
}));
vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(true),
}));
vi.mock('../../../js/modal-store.svelte.js', () => ({
    modals: mockModals,
    closeCreatePostModal: vi.fn(() => { mockModals.createPostModalOpen = false; }),
    openAuthModal: vi.fn(),
    openCreateDogModal: vi.fn(),
}));
vi.mock('../../../js/modal-history.js', () => ({
    pushModalState: vi.fn(),
    popModalState: vi.fn(),
}));
vi.mock('../../../js/ui.js', () => ({
    toggleBodyScroll: vi.fn(),
}));
vi.mock('../../../js/utils.js', () => ({
    showToast: vi.fn(),
    isValidFileType: vi.fn().mockReturnValue(true),
    isValidFileSize: vi.fn().mockReturnValue(true),
}));
vi.mock('../../../js/i18n-store.svelte.js', () => ({
    t: vi.fn((key: string) => key),
}));
vi.mock('../../../js/svelte-store.svelte.js', () => ({
    bumpFeedVersion: vi.fn(),
}));

const oneDog = [{ id: 'dog-1', name: 'Nelli', slug: 'nelli-1', profilePhoto: null }];
const twoDogs = [
    { id: 'dog-1', name: 'Nelli', slug: 'nelli-1', profilePhoto: null },
    { id: 'dog-2', name: 'Bella', slug: 'bella-1', profilePhoto: null },
];

describe('CreatePostModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockModals.createPostModalOpen = false;
    });

    it('is hidden by default', () => {
        const { container } = render(CreatePostModal);
        const modal = container.querySelector('#create-post-modal') as HTMLElement;
        expect(modal.style.display).toBe('none');
    });

    it('opens auth modal when unauthenticated user triggers open', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(false);

        const modalStore = await import('../../../js/modal-store.svelte.js');
        mockModals.createPostModalOpen = true;
        render(CreatePostModal);

        await waitFor(() => {
            expect(modalStore.openAuthModal).toHaveBeenCalled();
        });
    });

    it('opens create-dog modal when user has no dogs', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue([]);

        const modalStore = await import('../../../js/modal-store.svelte.js');
        mockModals.createPostModalOpen = true;
        render(CreatePostModal);

        await waitFor(() => {
            expect(modalStore.openCreateDogModal).toHaveBeenCalled();
        });
    });

    it('becomes visible when authenticated user with dogs opens it', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);

        mockModals.createPostModalOpen = true;
        const { container } = render(CreatePostModal);

        await waitFor(() => {
            const modal = container.querySelector('#create-post-modal') as HTMLElement;
            expect(modal.style.display).toBe('block');
        });
    });

    it('hides dog selector when user has single dog', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);

        mockModals.createPostModalOpen = true;
        const { container } = render(CreatePostModal);

        await waitFor(() => {
            const modal = container.querySelector('#create-post-modal') as HTMLElement;
            expect(modal.style.display).toBe('block');
        });
        // Dog selector should NOT be present
        expect(container.querySelector('#post-dog-select')).toBeNull();
    });

    it('shows dog selector when user has multiple dogs', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(twoDogs);

        mockModals.createPostModalOpen = true;
        const { container } = render(CreatePostModal);

        await waitFor(() => {
            const select = container.querySelector('#post-dog-select');
            expect(select).not.toBeNull();
        });
    });

    it('rejects invalid file type with toast', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);

        const utilsModule = await import('../../../js/utils.js');
        vi.mocked(utilsModule.isValidFileType).mockReturnValue(false);

        mockModals.createPostModalOpen = true;
        const { container } = render(CreatePostModal);

        await waitFor(() => {
            const modal = container.querySelector('#create-post-modal') as HTMLElement;
            expect(modal.style.display).toBe('block');
        });

        const fileInput = container.querySelector('#post-image-gallery-input') as HTMLInputElement;
        const badFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
        await fireEvent.change(fileInput, { target: { files: [badFile] } });

        expect(utilsModule.showToast).toHaveBeenCalled();
    });

    it('successful post creation calls uploadImage and createPost', async () => {
        const authModule = await import('../../../js/auth.js');
        vi.mocked(authModule.isAuthenticated).mockReturnValue(true);

        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.getMyDogs).mockResolvedValue(oneDog);
        vi.mocked(apiModule.uploadImage).mockResolvedValue('https://cdn.woofapp.fi/posts/test.jpg');
        vi.mocked(apiModule.createPost).mockResolvedValue({ id: 'new-post' });

        const utilsModule = await import('../../../js/utils.js');
        vi.mocked(utilsModule.isValidFileType).mockReturnValue(true);
        vi.mocked(utilsModule.isValidFileSize).mockReturnValue(true);

        const storeModule = await import('../../../js/svelte-store.svelte.js');

        mockModals.createPostModalOpen = true;
        const { container } = render(CreatePostModal);

        await waitFor(() => {
            const modal = container.querySelector('#create-post-modal') as HTMLElement;
            expect(modal.style.display).toBe('block');
        });

        // Select a file via gallery input
        const fileInput = container.querySelector('#post-image-gallery-input') as HTMLInputElement;
        const mockFile = new File(['image-data'], 'photo.jpg', { type: 'image/jpeg' });
        await fireEvent.change(fileInput, { target: { files: [mockFile] } });

        // Submit the form
        const form = container.querySelector('#create-post-form') as HTMLFormElement;
        await fireEvent.submit(form);

        await waitFor(() => {
            expect(apiModule.uploadImage).toHaveBeenCalled();
            expect(apiModule.createPost).toHaveBeenCalledWith('dog-1', 'https://cdn.woofapp.fi/posts/test.jpg', '');
            expect(storeModule.bumpFeedVersion).toHaveBeenCalled();
        });
    });
});
