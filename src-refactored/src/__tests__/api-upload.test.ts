import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies of api.js (not api.js itself — we're testing it)
vi.mock('../../js/auth.js', () => ({
    getToken: vi.fn().mockReturnValue('test-token-123'),
    handleSessionExpired: vi.fn().mockResolvedValue(false),
}));
vi.mock('../../js/utils.js', () => ({
    showToast: vi.fn(),
}));
vi.mock('../../js/i18n-store.svelte.js', () => ({
    t: vi.fn((key: string) => key),
}));

const PRESIGNED_URL = 'https://s3.eu-north-1.amazonaws.com/woof-uploads/presigned-test';
const PUBLIC_URL = 'https://cdn.woofapp.fi/posts/user1/photo.jpg';

describe('uploadImage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function mockFetchSuccess() {
        vi.mocked(global.fetch)
            // First call: apiRequest → POST /api/upload/presigned-url
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({
                    uploadUrl: PRESIGNED_URL,
                    publicUrl: PUBLIC_URL,
                })),
            } as any)
            // Second call: direct S3 PUT
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
            } as any);
    }

    function createMockFile() {
        return new File(['test-image-content'], 'photo.jpg', { type: 'image/jpeg' });
    }

    it('returns the public URL on successful upload', async () => {
        mockFetchSuccess();
        const { uploadImage } = await import('../../js/api.js');
        const file = createMockFile();
        const result = await uploadImage(file);
        expect(result).toBe(PUBLIC_URL);
    });

    it('sends correct presigned URL request', async () => {
        mockFetchSuccess();
        const { uploadImage } = await import('../../js/api.js');
        const file = createMockFile();
        await uploadImage(file);

        // First fetch call is the presigned URL request
        const firstCall = vi.mocked(global.fetch).mock.calls[0];
        expect(firstCall[0]).toContain('/api/upload/presigned-url');
        const opts = firstCall[1] as RequestInit;
        expect(opts.method).toBe('POST');
        const body = JSON.parse(opts.body as string);
        expect(body.filename).toBe('photo.jpg');
        expect(body.contentType).toBe('image/jpeg');
    });

    it('sends correct S3 PUT request with file body', async () => {
        mockFetchSuccess();
        const { uploadImage } = await import('../../js/api.js');
        const file = createMockFile();
        await uploadImage(file);

        // Second fetch call is the S3 PUT
        const secondCall = vi.mocked(global.fetch).mock.calls[1];
        expect(secondCall[0]).toBe(PRESIGNED_URL);
        const opts = secondCall[1] as RequestInit;
        expect(opts.method).toBe('PUT');
        expect(opts.body).toBe(file);
        expect((opts.headers as Record<string, string>)['Content-Type']).toBe('image/jpeg');
    });

    it('includes auth token in presigned URL request', async () => {
        mockFetchSuccess();
        const { uploadImage } = await import('../../js/api.js');
        await uploadImage(createMockFile());

        const firstCall = vi.mocked(global.fetch).mock.calls[0];
        const opts = firstCall[1] as RequestInit;
        expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token-123');
    });

    it('throws and shows toast when presigned URL request fails', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: () => Promise.resolve(JSON.stringify({ error: 'Server error' })),
        } as any);

        const { uploadImage } = await import('../../js/api.js');
        const { showToast } = await import('../../js/utils.js');

        await expect(uploadImage(createMockFile())).rejects.toThrow();
        expect(showToast).toHaveBeenCalled();
    });

    it('throws and shows toast when S3 PUT fails', async () => {
        vi.mocked(global.fetch)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({
                    uploadUrl: PRESIGNED_URL,
                    publicUrl: PUBLIC_URL,
                })),
            } as any)
            .mockResolvedValueOnce({
                ok: false,
                status: 403,
            } as any);

        const { uploadImage } = await import('../../js/api.js');
        const { showToast } = await import('../../js/utils.js');

        await expect(uploadImage(createMockFile())).rejects.toThrow('Upload failed');
        expect(showToast).toHaveBeenCalled();
    });

    it('throws and shows toast on network error', async () => {
        vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

        const { uploadImage } = await import('../../js/api.js');
        const { showToast } = await import('../../js/utils.js');

        await expect(uploadImage(createMockFile())).rejects.toThrow();
        expect(showToast).toHaveBeenCalled();
    });
});
