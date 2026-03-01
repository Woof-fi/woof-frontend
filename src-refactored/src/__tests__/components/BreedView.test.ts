import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BreedView from '../../views/BreedView.svelte';

const mockBreed = {
    id: 'breed-1',
    slug: 'miniature-schnauzer',
    name: 'Miniature Schnauzer',
    nameFi: 'Kääpiösnautseri',
    description: 'A friendly small breed',
    photo: null,
    dogCount: 5,
    followerCount: 12,
    isFollowing: false,
};

const mockPosts = [
    {
        id: 'post-1',
        dogId: 'dog-1',
        imageUrl: 'https://example.com/img1.jpg',
        caption: 'Test post 1',
        createdAt: '2024-01-01T00:00:00Z',
        dogName: 'Nelli',
        dogPhoto: null,
        dogSlug: 'nelli-1',
        dogLocation: 'Helsinki',
        breedName: 'Miniature Schnauzer',
        breedSlug: 'miniature-schnauzer',
        ownerName: 'Tommi',
        ownerId: 'user-1',
        likeCount: 3,
        commentCount: 1,
        likedByUser: false,
    },
];

const mockDogs = [
    {
        id: 'dog-1',
        slug: 'nelli-1',
        name: 'Nelli',
        profilePhoto: null,
        location: 'Helsinki',
        age: 5,
        followerCount: 10,
        postCount: 3,
    },
];

vi.mock('../../../js/api.js', () => ({
    getBreedBySlug: vi.fn().mockResolvedValue({
        id: 'breed-1',
        slug: 'miniature-schnauzer',
        name: 'Miniature Schnauzer',
        nameFi: 'Kääpiösnautseri',
        description: 'A friendly small breed',
        photo: null,
        dogCount: 5,
        followerCount: 12,
        isFollowing: false,
    }),
    getBreedFeed: vi.fn().mockResolvedValue({ posts: [], nextCursor: null }),
    getBreedDogs: vi.fn().mockResolvedValue({ dogs: [], nextCursor: null }),
    followBreed: vi.fn().mockResolvedValue({ message: 'Breed followed' }),
    unfollowBreed: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(true),
    getToken: vi.fn().mockReturnValue('test-token'),
}));

vi.mock('../../../js/utils.js', () => ({
    showToast: vi.fn(),
    imageVariant: vi.fn((url) => url),
}));

vi.mock('../../../js/svelte-store.svelte.js', () => ({
    store: { breedVersion: 0 },
    bumpBreedVersion: vi.fn(),
}));

describe('BreedView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders breed name', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            expect(container.querySelector('.breed-sheet-name')?.textContent).toBe('Miniature Schnauzer');
        });
    });

    it('renders breed description', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            expect(container.querySelector('.breed-sheet-desc')?.textContent).toBe('A friendly small breed');
        });
    });

    it('renders stats (dogs, followers, posts)', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            const stats = container.querySelectorAll('.breed-sheet-stat-num');
            expect(stats.length).toBe(3);
            expect(stats[0].textContent).toBe('5'); // dogCount
            expect(stats[1].textContent).toBe('12'); // followerCount
        });
    });

    it('renders follow button', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            const btn = container.querySelector('.follow-btn');
            expect(btn).not.toBeNull();
            expect(btn?.textContent).toContain('Follow');
        });
    });

    it('shows Posts and Dogs tabs', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            const tabs = container.querySelectorAll('.tab-link');
            expect(tabs.length).toBe(2);
            expect(tabs[0].textContent).toContain('Posts');
            expect(tabs[1].textContent).toContain('Dogs');
        });
    });

    it('shows gradient fallback when no photo', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            const gradient = container.querySelector('.breed-hero-gradient');
            expect(gradient).not.toBeNull();
        });
    });

    it('shows empty state when no posts', async () => {
        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            expect(container.querySelector('.empty-state')).not.toBeNull();
        });
    });

    it('renders posts grid when posts exist', async () => {
        const { getBreedFeed } = await import('../../../js/api.js');
        vi.mocked(getBreedFeed).mockResolvedValue({ posts: mockPosts, nextCursor: null });

        const { container } = render(BreedView, {
            props: { params: { slug: 'miniature-schnauzer' } },
        });

        await waitFor(() => {
            const gridItems = container.querySelectorAll('.posts-grid-item');
            expect(gridItems.length).toBe(1);
        });
    });
});
