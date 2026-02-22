import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import PostCard from '../../components/PostCard.svelte';

vi.mock('../../../js/api.js', () => ({
    likePost: vi.fn().mockResolvedValue({ likeCount: 1 }),
    unlikePost: vi.fn().mockResolvedValue({ likeCount: 0 }),
    createComment: vi.fn(),
    getComments: vi.fn().mockResolvedValue({ comments: [] }),
}));
vi.mock('../../../js/auth.js', () => ({
    isAuthenticated: vi.fn().mockReturnValue(true),
}));

const baseProps = {
    id: 'post-1',
    profilePic: '/test.jpg',
    username: 'Nelli',
    imageUrl: '/post.jpg',
    likeCount: 3,
    likedByUser: false,
    commentCount: 0,
    createdAt: new Date().toISOString(),
};

describe('PostCard', () => {
    it('renders username', () => {
        const { getAllByText } = render(PostCard, { props: baseProps });
        expect(getAllByText('Nelli').length).toBeGreaterThan(0);
    });

    it('shows like count', () => {
        const { getByText } = render(PostCard, { props: baseProps });
        expect(getByText('3')).toBeTruthy();
    });

    it('optimistically toggles liked class on click', async () => {
        const { container } = render(PostCard, { props: baseProps });
        const btn = container.querySelector('.like-button');
        expect(btn!.classList.contains('liked')).toBe(false);
        await fireEvent.click(btn!);
        expect(btn!.classList.contains('liked')).toBe(true);
    });

    it('reverts optimistic update if API fails', async () => {
        const apiModule = await import('../../../js/api.js');
        vi.mocked(apiModule.likePost).mockRejectedValueOnce(new Error('Network error'));
        const { container } = render(PostCard, { props: baseProps });
        const btn = container.querySelector('.like-button')!;
        await fireEvent.click(btn);
        await new Promise(r => setTimeout(r, 50));
        expect(btn.classList.contains('liked')).toBe(false);
    });

    it('calls onopenAuthModal when unauthenticated user clicks like', async () => {
        const authModule = await import('../../../js/auth.js');
        // mockReturnValue (not Once) — component calls isAuthenticated() during
        // render (for comment section) AND in handleLike; both must return false.
        vi.mocked(authModule.isAuthenticated).mockReturnValue(false);
        const handler = vi.fn();
        const { container } = render(PostCard, { props: { ...baseProps, onopenAuthModal: handler } });
        await fireEvent.click(container.querySelector('.like-button')!);
        expect(handler).toHaveBeenCalledTimes(1);
    });
});
