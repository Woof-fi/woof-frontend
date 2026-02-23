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
    deletePost: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../../js/utils.js', () => ({
    showToast: vi.fn(),
    timeAgo: vi.fn().mockReturnValue('2 hours ago'),
}));

const mockReport = {
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

    it('renders report cards when reports are returned', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Spam');
        await findByText('"This is a spammy post"');
        await findByText(/user@test\.com/);
    });

    it('shows action buttons for post reports', async () => {
        const storeModule = await import('../../../js/svelte-store.svelte.js');
        storeModule.store.authUser = { authenticated: true, role: 'admin' } as any;
        const { getReports } = await import('../../../js/api.js');
        vi.mocked(getReports).mockResolvedValue({ reports: [mockReport], nextCursor: null });
        const { findByText } = render(AdminView);
        await findByText('Delete post');
        await findByText('Mark reviewed');
        await findByText('Dismiss');
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
