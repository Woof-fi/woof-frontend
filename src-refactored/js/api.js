/**
 * API Service Layer
 * Centralized API calls with error handling and timeouts
 */

import { CONFIG } from './config.js';
import { showToast } from './utils.js';
import { getToken, handleSessionExpired } from './auth.js';
import { t } from './i18n-store.svelte.js';

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Make API request with timeout, error handling, and automatic token refresh.
 *
 * If the server returns 401 (Unauthorized) AND the user had a token, we try to
 * refresh the Cognito session once and retry the request. If the refresh fails
 * the user is logged out cleanly with a "session expired" toast.
 *
 * @param {string} endpoint - API endpoint (e.g., '/api/dogs')
 * @param {object} options - Fetch options
 * @param {boolean} _isRetry - Internal flag — true when retrying after token refresh
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, options = {}, _isRetry = false) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = getToken();

    // cache defaults to 'no-store' to prevent stale data after mutations.
    // Pass cache: 'default' for stable read-only endpoints (dog profiles, follow counts)
    // so the browser can honour Cache-Control headers from the server.
    const { cache = 'no-store', ...restOptions } = options;

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...restOptions,
            cache,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        });

        clearTimeout(timeout);

        // Parse response — handle empty body (e.g. 204 No Content)
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            // 401 with a token means it likely expired — try refresh once
            if (response.status === 401 && token && !_isRetry) {
                const refreshed = await handleSessionExpired();
                if (refreshed) {
                    // Retry with the fresh token
                    return apiRequest(endpoint, options, true);
                }
                // Refresh failed — user has been logged out by handleSessionExpired
                throw new APIError('Session expired', 401, data);
            }

            throw new APIError(
                (data && data.error) || 'API request failed',
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        clearTimeout(timeout);

        if (error.name === 'AbortError') {
            throw new APIError('Request timeout', 408, null);
        }

        if (error instanceof APIError) {
            throw error;
        }

        // Network error
        throw new APIError('Network error', 0, null);
    }
}

/**
 * Get all dogs
 * @returns {Promise<object[]>} - Array of dog objects
 */
export async function getAllDogs() {
    try {
        const data = await apiRequest('/api/dogs');
        return data.dogs || [];
    } catch (error) {
        console.error('Failed to fetch dogs:', error);
        showToast(t('dog.failedLoadDogs'), 'error');
        throw error;
    }
}

/**
 * Get current user's dogs (requires authentication)
 * @returns {Promise<object[]>} - Array of user's dog objects
 */
export async function getMyDogs() {
    try {
        const data = await apiRequest('/api/dogs/my/dogs');
        return data.dogs || [];
    } catch (error) {
        console.error('Failed to fetch my dogs:', error);
        // Don't show toast for this - it's used for navigation logic
        return [];
    }
}

/**
 * Get dog by ID
 * @param {string} id - Dog ID
 * @returns {Promise<object>} - Dog object
 */
export async function getDog(id) {
    try {
        const data = await apiRequest(`/api/dogs/${id}`, { cache: 'default' });
        return data.dog;
    } catch (error) {
        console.error(`Failed to fetch dog ${id}:`, error);
        if (error.status === 404) {
            showToast(t('dog.notFound'), 'error');
        } else {
            showToast(t('dog.failedLoad'), 'error');
        }
        throw error;
    }
}

/**
 * Get dog by slug (e.g., "nelli-1")
 * @param {string} slug - Dog slug
 * @returns {Promise<object>} - Dog object
 */
export async function getDogBySlug(slug) {
    try {
        const data = await apiRequest(`/api/dogs/slug/${slug}`, { cache: 'default' });
        return data.dog;
    } catch (error) {
        console.error(`Failed to fetch dog ${slug}:`, error);
        if (error.status === 404) {
            showToast(t('dog.notFound'), 'error');
        } else {
            showToast(t('dog.failedLoad'), 'error');
        }
        throw error;
    }
}

/**
 * Create new dog
 * @param {object} dogData - Dog data
 * @returns {Promise<object>} - Created dog object
 */
export async function createDog(dogData) {
    try {
        const data = await apiRequest('/api/dogs', {
            method: 'POST',
            body: JSON.stringify(dogData)
        });
        showToast(t('dog.profileCreated'), 'success');
        return data.dog;
    } catch (error) {
        console.error('Failed to create dog:', error);
        showToast(t('dog.failedCreate'), 'error');
        throw error;
    }
}

/**
 * Update dog
 * @param {string} id - Dog ID
 * @param {object} dogData - Dog data to update
 * @returns {Promise<object>} - Updated dog object
 */
export async function updateDog(id, dogData) {
    try {
        const data = await apiRequest(`/api/dogs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dogData)
        });
        showToast(t('dog.profileUpdatedApi'), 'success');
        return data.dog;
    } catch (error) {
        console.error(`Failed to update dog ${id}:`, error);
        showToast(t('dog.failedUpdate'), 'error');
        throw error;
    }
}

/**
 * Delete dog
 * @param {string} id - Dog ID
 * @returns {Promise<void>}
 */
export async function deleteDog(id) {
    try {
        await apiRequest(`/api/dogs/${id}`, {
            method: 'DELETE'
        });
        showToast(t('dog.profileDeleted'), 'success');
    } catch (error) {
        console.error(`Failed to delete dog ${id}:`, error);
        showToast(t('dog.failedDelete'), 'error');
        throw error;
    }
}

/**
 * Health check
 * @returns {Promise<boolean>} - True if API is healthy
 */
export async function healthCheck() {
    try {
        const data = await apiRequest('/health');
        return data.status === 'OK';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

/**
 * Create a new post (supports multi-image)
 * @param {string} dogId - Dog ID
 * @param {string|string[]} imageUrls - Single URL or array of S3 image URLs
 * @param {string} caption - Post caption
 * @returns {Promise<object>} - Created post object
 */
export async function createPost(dogId, imageUrls, caption) {
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    const data = await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ dog_id: dogId, image_urls: urls, caption })
    });
    return data.post;
}

/**
 * Get feed (public or following) with cursor-based pagination
 * @param {string} type - 'public' or 'following'
 * @param {string|null} cursor - ISO timestamp cursor for next page (null for first page)
 * @param {number} limit - Number of posts per page (default 20, max 50)
 * @returns {Promise<{posts: object[], nextCursor: string|null}>}
 */
export async function getFeed(type = 'public', cursor = null, limit = 20) {
    try {
        let url = `/api/posts/feed?type=${type}&limit=${limit}`;
        if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
        }
        const data = await apiRequest(url);
        return {
            posts: data.posts || [],
            nextCursor: data.nextCursor || null
        };
    } catch (error) {
        console.error('Failed to fetch feed:', error);
        showToast(t('common.failedLoadFeed'), 'error');
        throw error;
    }
}

/**
 * Get posts by a specific dog (for profile page)
 * @param {string} dogId - Dog ID
 * @param {string|null} cursor - ISO timestamp cursor for next page
 * @param {number} limit - Number of posts per page
 * @returns {Promise<{posts: object[], nextCursor: string|null}>}
 */
export async function getDogPosts(dogId, cursor = null, limit = 20) {
    try {
        let url = `/api/posts/dog/${dogId}?limit=${limit}`;
        if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
        }
        const data = await apiRequest(url);
        return {
            posts: data.posts || [],
            nextCursor: data.nextCursor || null
        };
    } catch (error) {
        console.error(`Failed to fetch posts for dog ${dogId}:`, error);
        throw error;
    }
}

/**
 * Get a single post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<object>} - Post object with full details
 */
export async function getPost(postId) {
    const data = await apiRequest(`/api/posts/${postId}`);
    return data.post;
}

// ============================================================================
// FOLLOW API
// ============================================================================

/**
 * Follow a dog
 * @param {string} dogId - ID of the dog to follow
 * @param {string} [followerDogId] - Optional: ID of your dog that should follow (defaults to first dog)
 * @returns {Promise<object>} Follow relationship data
 */
export async function followDog(dogId, followerDogId = null) {
    const body = { dog_id: dogId };
    if (followerDogId) body.follower_dog_id = followerDogId;

    return apiRequest('/api/follows', {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * Unfollow a dog
 * @param {string} dogId - ID of the dog to unfollow
 */
export async function unfollowDog(dogId) {
    return apiRequest(`/api/follows/${dogId}`, {
        method: 'DELETE'
    });
}

/**
 * Get follow status for a dog
 * @param {string} dogId - ID of the dog to check
 * @returns {Promise<{isFollowing: boolean, followerCount: number, followingCount: number}>}
 */
export async function getFollowStatus(dogId) {
    return apiRequest(`/api/follows/status/${dogId}`, { cache: 'default' });
}

/**
 * Get followers of a dog
 * @param {string} dogId - ID of the dog
 * @returns {Promise<object[]>} List of follower dogs
 */
export async function getFollowers(dogId) {
    return apiRequest(`/api/follows/${dogId}/followers`);
}

/**
 * Get dogs that a dog is following
 * @param {string} dogId - ID of the dog
 * @returns {Promise<object[]>} List of followed dogs
 */
export async function getFollowing(dogId) {
    return apiRequest(`/api/follows/${dogId}/following`);
}

// ============================================================================
// LIKES API
// ============================================================================

/**
 * Like a post
 * @param {string} postId - ID of the post to like
 * @returns {Promise<{like: object, likeCount: number}>}
 */
export async function likePost(postId) {
    return apiRequest('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId })
    });
}

/**
 * Unlike a post
 * @param {string} postId - ID of the post to unlike
 * @returns {Promise<{likeCount: number}>}
 */
export async function unlikePost(postId) {
    return apiRequest(`/api/likes/${postId}`, {
        method: 'DELETE'
    });
}

/**
 * Get dogs that liked a post
 * @param {string} postId - ID of the post
 * @returns {Promise<{likers: object[]}>}
 */
export async function getPostLikers(postId) {
    return apiRequest(`/api/likes/${postId}/likers`);
}

// ============================================================================
// COMMENTS API
// ============================================================================

/**
 * Create a comment on a post
 * @param {string} postId - ID of the post
 * @param {string} content - Comment text
 * @returns {Promise<{comment: object, commentCount: number}>}
 */
export async function createComment(postId, content) {
    return apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId, content })
    });
}

/**
 * Get comments for a post
 * @param {string} postId - ID of the post
 * @param {string|null} cursor - ISO timestamp cursor for pagination
 * @param {number} limit - Number of comments per page
 * @returns {Promise<{comments: object[], total: number, nextCursor: string|null}>}
 */
export async function getComments(postId, cursor = null, limit = 20) {
    let url = `/api/comments/${postId}?limit=${limit}`;
    if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    return apiRequest(url);
}

/**
 * Delete a comment
 * @param {string} commentId - ID of the comment
 * @returns {Promise<{commentCount: number}>}
 */
export async function deleteComment(commentId) {
    return apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE'
    });
}

/**
 * Update a comment
 * @param {string} commentId - ID of the comment
 * @param {string} content - New comment content
 * @returns {Promise<{comment: object}>}
 */
export async function updateComment(commentId, content) {
    return apiRequest(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    });
}

// ============================================================================
// UPLOAD API
// ============================================================================

/**
 * Upload image to S3
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export async function uploadImage(file) {
    try {
        // Get presigned URL from backend
        const urlData = await apiRequest('/api/upload/presigned-url', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type
            })
        });

        // Upload directly to S3 using presigned URL
        const uploadResponse = await fetch(urlData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }

        return urlData.publicUrl;
    } catch (error) {
        console.error('Failed to upload image:', error);
        showToast(t('common.failedUpload'), 'error');
        throw error;
    }
}

// ============================================================================
// HEALTH RECORDS API
// ============================================================================

/**
 * Get health records for a dog
 * @param {string} dogId - Dog ID
 * @param {object} options - Query options
 * @param {string} [options.type] - Filter by record type
 * @param {string} [options.cursor] - Pagination cursor
 * @param {number} [options.limit] - Records per page
 * @returns {Promise<{records: object[], total: number, nextCursor: string|null}>}
 */
export async function getHealthRecords(dogId, { type, cursor, limit = 20 } = {}) {
    let url = `/api/dogs/${dogId}/health?limit=${limit}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    return apiRequest(url);
}

/**
 * Create a health record
 * @param {string} dogId - Dog ID
 * @param {object} data - Record data { type, date, description, notes?, value? }
 * @returns {Promise<{record: object}>}
 */
export async function createHealthRecord(dogId, data) {
    return apiRequest(`/api/dogs/${dogId}/health`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Update a health record
 * @param {string} dogId - Dog ID
 * @param {string} recordId - Health record ID
 * @param {object} data - Fields to update
 * @returns {Promise<{record: object}>}
 */
export async function updateHealthRecord(dogId, recordId, data) {
    return apiRequest(`/api/dogs/${dogId}/health/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * Delete a health record
 * @param {string} dogId - Dog ID
 * @param {string} recordId - Health record ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteHealthRecord(dogId, recordId) {
    return apiRequest(`/api/dogs/${dogId}/health/${recordId}`, {
        method: 'DELETE'
    });
}

// ============================================================================
// MESSAGING API
// ============================================================================

/**
 * Get conversations list
 * @returns {Promise<{conversations: object[]}>}
 */
export async function getConversations() {
    return apiRequest('/api/messages/conversations');
}

/**
 * Start or find a conversation with a dog
 * @param {string} dogId - Target dog ID
 * @param {string} [senderDogId] - Optional sender dog ID
 * @returns {Promise<{conversationId: string, created: boolean}>}
 */
export async function startConversation(dogId, senderDogId = null) {
    const body = { dogId };
    if (senderDogId) body.senderDogId = senderDogId;
    return apiRequest('/api/messages/conversations', {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * Get messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string|null} cursor - Pagination cursor
 * @param {number} limit - Messages per page
 * @returns {Promise<{messages: object[], nextCursor: string|null, otherDog: object}>}
 */
export async function getMessages(conversationId, cursor = null, limit = 50) {
    let url = `/api/messages/conversations/${conversationId}?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    return apiRequest(url);
}

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message text
 * @param {string} [senderDogId] - Optional sender dog ID
 * @returns {Promise<{message: object}>}
 */
export async function sendMessage(conversationId, content, senderDogId = null) {
    const body = { content };
    if (senderDogId) body.senderDogId = senderDogId;
    return apiRequest(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * Mark a conversation as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<{success: boolean}>}
 */
export async function markConversationRead(conversationId) {
    return apiRequest(`/api/messages/conversations/${conversationId}/read`, {
        method: 'PUT'
    });
}

/**
 * Get total unread message count
 * @returns {Promise<{unreadCount: number}>}
 */
export async function getUnreadCount() {
    return apiRequest('/api/messages/unread-count');
}

/**
 * Sync authenticated Cognito user to backend DB (creates record if first login).
 * Must be called on app init whenever a valid session is already present.
 * @returns {Promise<object|null>} - User object or null on failure
 */
export async function syncUser() {
    try {
        const data = await apiRequest('/api/auth/sync', { method: 'POST' });
        return data.user ?? null;
    } catch (error) {
        console.error('User sync failed:', error);
        return null;
    }
}

// ============================================================================
// REPORTS API
// ============================================================================

/**
 * Report a post, comment, or dog
 * @param {string} targetType - 'post' | 'comment' | 'dog'
 * @param {string} targetId - UUID of the target
 * @param {string} reason - Report reason
 * @param {string} [description] - Optional description
 * @returns {Promise<{report: object}>}
 */
export async function reportContent(targetType, targetId, reason, description) {
    return apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reason, description })
    });
}

/**
 * Update a post's caption (owner only)
 * @param {string} postId - Post ID
 * @param {string} caption - New caption text
 * @returns {Promise<object>} - Updated post object
 */
export async function updatePost(postId, caption) {
    try {
        const data = await apiRequest(`/api/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify({ caption })
        });
        showToast(t('postEdit.captionUpdated'), 'success');
        return data.post;
    } catch (error) {
        console.error(`Failed to update post ${postId}:`, error);
        showToast(t('postEdit.failedUpdate'), 'error');
        throw error;
    }
}

/**
 * Delete a post (owner only)
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export async function deletePost(postId) {
    return apiRequest(`/api/posts/${postId}`, { method: 'DELETE' });
}

/**
 * Toggle bookmark on a post
 * @param {string} postId - Post ID
 * @returns {Promise<{bookmarked: boolean}>}
 */
export async function toggleBookmark(postId) {
    return apiRequest(`/api/bookmarks/${postId}/toggle`, { method: 'POST' });
}

/**
 * Get bookmark status for a post
 * @param {string} postId - Post ID
 * @returns {Promise<{bookmarked: boolean}>}
 */
export async function getBookmarkStatus(postId) {
    return apiRequest(`/api/bookmarks/${postId}/status`);
}

/**
 * Get bookmarked posts for the current user (paginated)
 * @param {string|null} cursor - ISO timestamp cursor for next page
 * @param {number} limit - Posts per page
 * @returns {Promise<{posts: object[], nextCursor: string|null}>}
 */
export async function getBookmarkedPosts(cursor = null, limit = 20) {
    let url = `/api/bookmarks?limit=${limit}`;
    if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    const data = await apiRequest(url);
    return {
        posts: data.posts || [],
        nextCursor: data.nextCursor || null
    };
}

/**
 * Get reports (admin/moderator only)
 * @param {object} [opts] - { status, cursor, limit }
 * @returns {Promise<{reports: object[], nextCursor: string|null}>}
 */
export async function getReports({ status, cursor, limit } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (cursor) params.set('cursor', cursor);
    if (limit)  params.set('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/reports${qs}`);
}

/**
 * Update a report's status (admin/moderator only)
 * @param {string} reportId
 * @param {string} status - 'pending' | 'reviewed' | 'actioned' | 'dismissed'
 * @returns {Promise<{report: object}>}
 */
export async function updateReportStatus(reportId, status) {
    return apiRequest(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

/**
 * Get notifications for the current user
 * @param {string|null} cursor - Pagination cursor
 * @param {number} limit - Notifications per page
 * @returns {Promise<{notifications: object[], nextCursor: string|null}>}
 */
export async function getNotifications(cursor = null, limit = 20) {
    let url = `/api/notifications?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    return apiRequest(url);
}

/**
 * Get unread notification count for the current user
 * @returns {Promise<{unreadCount: number}>}
 */
export async function getNotifUnreadCount() {
    return apiRequest('/api/notifications/unread-count');
}

/**
 * Mark all notifications as read
 * @returns {Promise<null>}
 */
export async function markNotificationsRead() {
    return apiRequest('/api/notifications/read', { method: 'PUT' });
}

// ============================================================================
// ADMIN API
// ============================================================================

/**
 * Delete any post as admin/moderator (bypasses ownership check)
 * @param {string} postId
 * @returns {Promise<void>}
 */
export async function adminDeletePost(postId) {
    return apiRequest(`/api/admin/posts/${postId}`, { method: 'DELETE' });
}

/**
 * Delete any comment as admin/moderator (bypasses ownership check)
 * @param {string} commentId
 * @returns {Promise<void>}
 */
export async function adminDeleteComment(commentId) {
    return apiRequest(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
}

/**
 * Ban a user (admin only)
 * @param {string} userId
 * @returns {Promise<{userId: string, banned: boolean}>}
 */
export async function banUser(userId) {
    return apiRequest(`/api/admin/users/${userId}/ban`, { method: 'PUT' });
}

/**
 * Unban a user (admin only)
 * @param {string} userId
 * @returns {Promise<{userId: string, banned: boolean}>}
 */
export async function unbanUser(userId) {
    return apiRequest(`/api/admin/users/${userId}/unban`, { method: 'PUT' });
}

/**
 * Get Rekognition-flagged posts (admin/moderator only)
 * @returns {Promise<{posts: object[]}>}
 */
export async function getFlaggedPosts() {
    return apiRequest('/api/admin/moderation/flagged');
}

/**
 * Approve or remove a Rekognition-flagged post (admin/moderator only)
 * @param {string} postId
 * @param {'approved'|'removed'} status
 * @returns {Promise<any>}
 */
export async function updatePostModeration(postId, status) {
    return apiRequest(`/api/admin/moderation/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

// ============================================================================
// BREEDS
// ============================================================================

/**
 * Search breeds by query (matches both EN and FI names)
 * @param {string} query - Search term
 * @returns {Promise<object[]>} - Array of breed objects
 */
export async function searchBreeds(query) {
    try {
        const data = await apiRequest(`/api/breeds/search?q=${encodeURIComponent(query)}`, { cache: 'default' });
        return data.breeds || [];
    } catch (error) {
        console.error('Failed to search breeds:', error);
        return [];
    }
}

/**
 * Get all breeds
 * @returns {Promise<object[]>} - Array of all breed objects
 */
export async function getAllBreeds() {
    try {
        const data = await apiRequest('/api/breeds', { cache: 'default' });
        return data.breeds || [];
    } catch (error) {
        console.error('Failed to fetch breeds:', error);
        return [];
    }
}

/**
 * Get breed by slug
 * @param {string} slug - Breed slug
 * @returns {Promise<object>} - Breed object with dog count, follower count, isFollowing
 */
export async function getBreedBySlug(slug) {
    try {
        const data = await apiRequest(`/api/breeds/${slug}`, { cache: 'default' });
        return data.breed;
    } catch (error) {
        console.error(`Failed to fetch breed ${slug}:`, error);
        throw error;
    }
}

/**
 * Follow a breed
 * @param {string} slug - Breed slug
 * @returns {Promise<object>}
 */
export async function followBreed(slug) {
    return apiRequest(`/api/breeds/${slug}/follow`, { method: 'POST' });
}

/**
 * Unfollow a breed
 * @param {string} slug - Breed slug
 * @returns {Promise<void>}
 */
export async function unfollowBreed(slug) {
    return apiRequest(`/api/breeds/${slug}/follow`, { method: 'DELETE' });
}

/**
 * Get breed feed (posts from dogs of this breed)
 * @param {string} slug - Breed slug
 * @param {string|null} cursor - Cursor for pagination
 * @param {number} limit - Posts per page
 * @returns {Promise<{posts: object[], nextCursor: string|null}>}
 */
export async function getBreedFeed(slug, cursor = null, limit = 20) {
    let url = `/api/breeds/${slug}/feed?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    const data = await apiRequest(url);
    return { posts: data.posts || [], nextCursor: data.nextCursor || null };
}

/**
 * Get dogs of a breed
 * @param {string} slug - Breed slug
 * @param {string|null} cursor - Cursor for pagination
 * @param {number} limit - Dogs per page
 * @returns {Promise<{dogs: object[], nextCursor: string|null}>}
 */
export async function getBreedDogs(slug, cursor = null, limit = 20) {
    let url = `/api/breeds/${slug}/dogs?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    const data = await apiRequest(url);
    return { dogs: data.dogs || [], nextCursor: data.nextCursor || null };
}

/**
 * Get popular breeds (by dog count)
 * @returns {Promise<object[]>} - Array of breed objects with dogCount
 */
export async function getPopularBreeds() {
    try {
        const data = await apiRequest('/api/breeds/popular', { cache: 'default' });
        return data.breeds || [];
    } catch (error) {
        console.error('Failed to fetch popular breeds:', error);
        return [];
    }
}

/**
 * Get breeds the current user follows
 * @returns {Promise<object[]>} - Array of breed objects
 */
export async function getFollowingBreeds() {
    try {
        const data = await apiRequest('/api/breeds/following');
        return data.breeds || [];
    } catch (error) {
        console.error('Failed to fetch following breeds:', error);
        return [];
    }
}

// ============================================================================
// TERRITORIES
// ============================================================================

/**
 * Search territories by text query
 * @param {string} query - Search term
 * @returns {Promise<object[]>} - Array of territory objects with hasChildren flag
 */
export async function searchTerritories(query) {
    try {
        const data = await apiRequest(`/api/territories/search?q=${encodeURIComponent(query)}`, { cache: 'default' });
        return data.territories || [];
    } catch (error) {
        console.error('Failed to search territories:', error);
        return [];
    }
}

/**
 * Browse children of a territory (for drill-down autocomplete)
 * @param {string} parentId - Parent territory UUID
 * @returns {Promise<object[]>} - Array of child territory objects with hasChildren flag
 */
export async function browseTerritoryChildren(parentId) {
    try {
        const data = await apiRequest(`/api/territories/search?parent=${encodeURIComponent(parentId)}`, { cache: 'default' });
        return data.territories || [];
    } catch (error) {
        console.error('Failed to browse territory children:', error);
        return [];
    }
}

/**
 * Get all territories
 * @returns {Promise<object[]>} - Array of all territory objects
 */
export async function getAllTerritories() {
    try {
        const data = await apiRequest('/api/territories', { cache: 'default' });
        return data.territories || [];
    } catch (error) {
        console.error('Failed to fetch territories:', error);
        return [];
    }
}

/**
 * Get territory directory (municipalities grouped by country with dog counts)
 * @returns {Promise<{countries: object[], popular: object[], total: number}>}
 */
export async function getTerritoryDirectory() {
    try {
        const data = await apiRequest('/api/territories/directory', { cache: 'default' });
        return data;
    } catch (error) {
        console.error('Failed to fetch territory directory:', error);
        return { countries: [], popular: [], total: 0 };
    }
}

/**
 * Get territory detail by hierarchical path
 * @param {string} path - URL path (e.g. "helsinki/oulunkyla/patola")
 * @returns {Promise<object>} - Territory object with stats, children, breadcrumb
 */
export async function getTerritoryByPath(path) {
    const data = await apiRequest(`/api/territories/by-path/${path}`, { cache: 'default' });
    return data.territory;
}

/**
 * Get territory feed (posts from dogs in territory subtree)
 * @param {string} path - URL path
 * @param {string|null} cursor - Cursor for pagination
 * @param {number} limit - Posts per page
 * @returns {Promise<{posts: object[], nextCursor: string|null}>}
 */
export async function getTerritoryFeed(path, cursor = null, limit = 20) {
    let url = `/api/territories/by-path/${path}/feed?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    const data = await apiRequest(url);
    return { posts: data.posts || [], nextCursor: data.nextCursor || null };
}

/**
 * Get dogs in a territory
 * @param {string} path - URL path
 * @param {string|null} cursor - Cursor for pagination
 * @param {number} limit - Dogs per page
 * @returns {Promise<{dogs: object[], nextCursor: string|null}>}
 */
export async function getTerritoryDogs(path, cursor = null, limit = 20, breedId = null) {
    let url = `/api/territories/by-path/${path}/dogs?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    if (breedId) url += `&breedId=${encodeURIComponent(breedId)}`;
    const data = await apiRequest(url);
    return { dogs: data.dogs || [], nextCursor: data.nextCursor || null };
}

/**
 * Follow a territory
 * @param {string} id - Territory UUID
 * @returns {Promise<object>}
 */
export async function followTerritory(id) {
    return apiRequest(`/api/territories/${id}/follow`, { method: 'POST' });
}

/**
 * Unfollow a territory
 * @param {string} id - Territory UUID
 * @returns {Promise<void>}
 */
export async function unfollowTerritory(id) {
    return apiRequest(`/api/territories/${id}/follow`, { method: 'DELETE' });
}

/**
 * Get territories the current user follows
 * @returns {Promise<object[]>} - Array of territory objects with urlPath
 */
export async function getFollowingTerritories() {
    try {
        const data = await apiRequest('/api/territories/following');
        return data.territories || [];
    } catch (error) {
        console.error('Failed to fetch following territories:', error);
        return [];
    }
}

/**
 * Get breeds with dog counts in a territory subtree
 * @param {string} path - URL path (e.g. "helsinki")
 * @returns {Promise<object[]>} - Array of breed objects with dogCount
 */
export async function getTerritoryBreeds(path) {
    try {
        const data = await apiRequest(`/api/territories/by-path/${path}/breeds`);
        return data.breeds || [];
    } catch (error) {
        console.error('Failed to fetch territory breeds:', error);
        return [];
    }
}

// ============================================================================
// DOG PARK API
// ============================================================================

export async function getTerritoryParks(path) {
    try {
        const data = await apiRequest(`/api/territories/by-path/${path}/parks`);
        return data.parks || [];
    } catch (error) {
        console.error('Failed to fetch territory parks:', error);
        return [];
    }
}

export async function getDogPark(slug) {
    const data = await apiRequest(`/api/dog-parks/${slug}`, { cache: 'default' });
    return data.park;
}

export async function suggestDogPark(parkData) {
    return apiRequest('/api/dog-parks/suggest', {
        method: 'POST',
        body: JSON.stringify(parkData),
    });
}

export async function getAdminPendingParks() {
    const data = await apiRequest('/api/admin/dog-parks/pending');
    return data.parks || [];
}

export async function getAdminUnmatchedParks() {
    const data = await apiRequest('/api/admin/dog-parks/unmatched');
    return data.parks || [];
}

export async function updateAdminDogPark(id, updates) {
    return apiRequest(`/api/admin/dog-parks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

export async function deleteAdminDogPark(id) {
    return apiRequest(`/api/admin/dog-parks/${id}`, {
        method: 'DELETE',
    });
}

// Dog park follows
export async function followDogPark(parkId) {
    return apiRequest(`/api/dog-parks/${parkId}/follow`, { method: 'POST' });
}

export async function unfollowDogPark(parkId) {
    return apiRequest(`/api/dog-parks/${parkId}/follow`, { method: 'DELETE' });
}

export async function getFollowingDogParks() {
    const data = await apiRequest('/api/dog-parks/following', { cache: 'default' });
    return data.parks || [];
}

/**
 * Get upcoming visits at parks the current user follows
 * @returns {Promise<object[]>} - Array of visit objects with dog + park info
 */
export async function getFollowingVisits() {
    try {
        const data = await apiRequest('/api/dog-parks/following/visits');
        return data.visits || [];
    } catch (error) {
        console.error('Failed to fetch following visits:', error);
        return [];
    }
}

/**
 * Get new dogs in territories the current user follows (sub_district, last 7 days)
 * @returns {Promise<object[]>} - Array of dog objects
 */
export async function getNewDogsInFollowedAreas() {
    try {
        const data = await apiRequest('/api/posts/feed/new-dogs');
        return data.dogs || [];
    } catch (error) {
        console.error('Failed to fetch new dogs:', error);
        return [];
    }
}

/**
 * Search all dog parks by name, Finnish name, city, or address
 * @param {string} query - Search term (min 2 chars)
 * @returns {Promise<object[]>} - Array of matching park objects
 */
export async function searchDogParks(query) {
    try {
        const data = await apiRequest(`/api/dog-parks/search?q=${encodeURIComponent(query)}`, { cache: 'default' });
        return data.parks || [];
    } catch (error) {
        console.error('Failed to search dog parks:', error);
        return [];
    }
}

// Amenity suggestions
export async function suggestParkAmenity(parkId, amenityKey, amenityValue) {
    return apiRequest(`/api/dog-parks/${parkId}/amenity-suggestions`, {
        method: 'POST',
        body: JSON.stringify({ amenityKey, amenityValue }),
    });
}

export async function getAdminPendingAmenitySuggestions() {
    const data = await apiRequest('/api/admin/amenity-suggestions/pending');
    return data.suggestions || [];
}

export async function reviewAmenitySuggestion(id, status) {
    return apiRequest(`/api/admin/amenity-suggestions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

// Park visits
export async function scheduleParkVisit(parkId, visitData) {
    return apiRequest(`/api/dog-parks/${parkId}/visits`, {
        method: 'POST',
        body: JSON.stringify(visitData),
    });
}

export async function cancelParkVisit(visitId) {
    return apiRequest(`/api/dog-parks/visits/${visitId}`, { method: 'DELETE' });
}

export async function getUpcomingParkVisits(parkId) {
    const data = await apiRequest(`/api/dog-parks/${parkId}/visits`, { cache: 'default' });
    return data.visits || [];
}

// Export APIError for use in other modules
export { APIError };
