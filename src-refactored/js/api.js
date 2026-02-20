/**
 * API Service Layer
 * Centralized API calls with error handling and timeouts
 */

import { CONFIG } from './config.js';
import { showToast } from './utils.js';
import { getToken } from './auth.js';

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
 * Make API request with timeout and error handling
 * @param {string} endpoint - API endpoint (e.g., '/api/dogs')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = getToken();

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        });

        clearTimeout(timeout);

        // Parse response
        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.error || 'API request failed',
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
        showToast('Failed to load dogs. Please try again.', 'error');
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
        const data = await apiRequest(`/api/dogs/${id}`);
        return data.dog;
    } catch (error) {
        console.error(`Failed to fetch dog ${id}:`, error);
        if (error.status === 404) {
            showToast('Dog not found.', 'error');
        } else {
            showToast('Failed to load dog profile. Please try again.', 'error');
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
        const data = await apiRequest(`/api/dogs/slug/${slug}`);
        return data.dog;
    } catch (error) {
        console.error(`Failed to fetch dog ${slug}:`, error);
        if (error.status === 404) {
            showToast('Dog not found.', 'error');
        } else {
            showToast('Failed to load dog profile. Please try again.', 'error');
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
        showToast('Dog profile created successfully!', 'success');
        return data.dog;
    } catch (error) {
        console.error('Failed to create dog:', error);
        showToast('Failed to create dog profile. Please try again.', 'error');
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
        showToast('Profile updated successfully!', 'success');
        return data.dog;
    } catch (error) {
        console.error(`Failed to update dog ${id}:`, error);
        showToast('Failed to update profile. Please try again.', 'error');
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
        showToast('Profile deleted successfully.', 'success');
    } catch (error) {
        console.error(`Failed to delete dog ${id}:`, error);
        showToast('Failed to delete profile. Please try again.', 'error');
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
 * Create a new post
 * @param {string} dogId - Dog ID
 * @param {string} imageUrl - S3 image URL
 * @param {string} caption - Post caption
 * @returns {Promise<object>} - Created post object
 */
export async function createPost(dogId, imageUrl, caption) {
    try {
        const data = await apiRequest('/api/posts', {
            method: 'POST',
            body: JSON.stringify({ dog_id: dogId, image_url: imageUrl, caption })
        });
        showToast('Post created successfully!', 'success');
        return data.post;
    } catch (error) {
        console.error('Failed to create post:', error);
        showToast('Failed to create post. Please try again.', 'error');
        throw error;
    }
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
        showToast('Failed to load feed. Please try again.', 'error');
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
    return apiRequest(`/api/follows/status/${dogId}`);
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
        showToast('Failed to upload image. Please try again.', 'error');
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

// Export APIError for use in other modules
export { APIError };
