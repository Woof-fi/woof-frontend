import { render, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminView from '../../views/AdminView.svelte';

// Factory must not reference outer variables (vi.mock is hoisted)
vi.mock('../../../js/svelte-store.svelte.js', () => ({
    store: { authUser: null },
}));

vi.mock('../../../js/api.js', () => ({
    getReports: vi.fn().mockResolvedValue({ reports: [], nextCursor: null }),
    updateReportStatus: vi.fn().mockResolvedValue({ report: { id: 'r1', status: 'dismissed' } }),
    adminDeletePost: vi.fn().mockResolvedValue(null),
    adminDeleteComment: vi.fn().mockResolvedValue(null),
    banUser: vi.fn().mockResolvedValue({ userId: 'u1', banned: true }),
    unbanUser: vi.fn().mockResolvedValue({ userId: 'u1', banned: false }),
}));

vi.mock('../../../js/utils.js', () => ({
    showToast: vi.fn(),
    timeAgo: vi.fn().mockReturnValue('2 hours ago'),
}));

const mockPostReport = {
    id: 'report-1',
    target_type: 'post',
    target_id: 'post-abc',
    reason: 'spam',
    status: 'pending',
    reporter_email: 'user@test.com',
    created_at: new Date().toISOString(),
    post_caption: 'This is a spammy post',
    post_image_url: null,
    post_dog_name: 'Nelli',
    post_dog_slug: 'nelli-1',
    post_owner_user_id: 'owner-user-1',
    post_owner_banned_at: null,
    description: null,
};

const mockCommentReport = {
    id: 'report-2',
    target_type: 'comment',
    target_id: 'comment-xyz',
    reason: 'harassment',
    status: 'pending',
    reporter_email: 'user@test.com',
    created_at: new Date().toISOString(),
    comment_content: 'This is a harassing comment',
    comment_dog_name: 'Luna',
    comment_dog_slug: 'luna-2',
    comment_owner_user_id: 'owner-user-2',
    comment_owner_banned_at: null,
    post_caption: null,
    post_image_url: null,
    post_dog_name: null,
    description: null,
};

describe('AdminView', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Reset to non-admin by default
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = null;
    });

    it('shows access denied when user is not authenticated', async () => {
        const { container } = render(AdminView);
        expect(container.textContent).toContain('Access denied');
    });

    it('shows access denied when user has role "user"', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'user' } as any;
        const { container } = render(AdminView);
        expect(container.textContent).toContain('Access denied');
    });

    it('renders the admin panel for admin role', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { findByText } = render(AdminView);
        await findByText('Moderation');
    });

    it('renders the admin panel for moderator role', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'moderator' } as any;
        const { findByText } = render(AdminView);
        await findByText('Moderation');
    });

    it('shows the status filter tabs for admin', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { findByText } = render(AdminView);
        await findByText('Pending');
        await findByText('Dismissed');
        await findByText('All');
    });

    it('shows empty state when there are no reports', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText(/no.*reports/i);
    });

    it('renders post report cards with caption', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockPostReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Spam');
        await findByText('"This is a spammy post"');
        await findByText(/user@test\.com/);
    });

    it('renders comment report cards with comment content', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockCommentReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('"This is a harassing comment"');
        await findByText('Luna');
    });

    it('shows Delete post action button for post reports', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockPostReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Delete post');
        await findByText('Mark reviewed');
        await findByText('Dismiss');
    });

    it('shows Delete comment action button for comment reports', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockCommentReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Delete comment');
    });

    it('calls adminDeletePost (not deletePost) when deleting a post report', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const api = await import('../../../js/api.js');
        vi.mocked(api.getReports).mockResolvedValue({ reports: [mockPostReport], nextCursor: null });
        const { findByText } = render(AdminView);
        const deleteBtn = await findByText('Delete post');
        deleteBtn.click();
        await waitFor(() => {
            expect(api.adminDeletePost).toHaveBeenCalledWith('post-abc');
        });
    });

    it('shows Ban user button for admin role on post reports with owner', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockPostReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Ban user');
    });

    it('hides Ban user button for moderator role', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'moderator' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockPostReport], nextCursor: null });
        const { queryByText, findByText } = render(AdminView);
        await findByText('Delete post'); // wait for render
        expect(queryByText('Ban user')).toBeNull();
    });

    it('shows Unban user button when post owner is already banned', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        const bannedReport = { ...mockPostReport, post_owner_banned_at: new Date().toISOString() };
        vi.mocked(getReports).mockResolvedValue({ reports: [bannedReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Unban user');
    });

    it('calls getReports with pending filter by default', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [], nextCursor: null });
        render(AdminView);
        await waitFor(() => {
            expect(getReports).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'pending' })
            );
        });
    });
});
