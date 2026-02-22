import { render, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Feed from '../../components/Feed.svelte';

vi.mock('../../../js/api.js', () => ({
    getFeed: vi.fn(),
    getMyDogs: vi.fn().mockResolvedValue([]),
    getAllDogs: vi.fn().mockResolvedValue([]),
    getUnreadCount: vi.fn().mockResolvedValue({ unreadCount: 0 }),
}));
vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(true),
}));

const mockPost = (id: string) => ({
    id,
    dogName: 'Nelli',
    dogPhoto: '/nelli.jpg',
    dogSlug: 'nelli-1',
    imageUrl: '/post.jpg',
    caption: 'Hello',
    likeCount: 0,
    commentCount: 0,
    likedByUser: false,
    createdAt: new Date().toISOString(),
});

describe('Feed (contract tests)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Reset auth mock to authenticated by default
        const { isAuthenticated } = await import('../../../js/auth.js');
        vi.mocked(isAuthenticated).mockReturnValue(true);
        // Reset API mocks
        const { getMyDogs, getAllDogs } = await import('../../../js/api.js');
        vi.mocked(getMyDogs).mockResolvedValue([]);
        vi.mocked(getAllDogs).mockResolvedValue([]);
    });

    it('renders posts after loading', async () => {
        const { getFeed } = await import('../../../js/api.js');
        vi.mocked(getFeed).mockResolvedValue({
            posts: [mockPost('p1'), mockPost('p2')],
            nextCursor: null,
        });
        const { findAllByRole } = render(Feed, { props: { type: 'public' } });
        const btns = await findAllByRole('button', { name: /like/i });
        expect(btns.length).toBeGreaterThanOrEqual(2);
    });

    it('shows content gate after 4 posts when unauthenticated', async () => {
        const { getFeed } = await import('../../../js/api.js');
        const { isAuthenticated } = await import('../../../js/auth.js');
        vi.mocked(isAuthenticated).mockReturnValue(false);
        vi.mocked(getFeed).mockResolvedValue({
            posts: Array.from({ length: 6 }, (_, i) => mockPost(`p${i}`)),
            nextCursor: null,
        });
        const { findAllByText } = render(Feed, { props: { type: 'public' } });
        const signUpElements = await findAllByText(/sign up/i);
        expect(signUpElements.length).toBeGreaterThan(0);
    });

    it('shows empty state on following tab with no results', async () => {
        const { getFeed } = await import('../../../js/api.js');
        const { isAuthenticated } = await import('../../../js/auth.js');
        vi.mocked(isAuthenticated).mockReturnValue(true);
        vi.mocked(getFeed).mockResolvedValue({ posts: [], nextCursor: null });
        const { findByText } = render(Feed, { props: { type: 'following' } });
        await findByText(/following feed is empty/i);
    });
});
