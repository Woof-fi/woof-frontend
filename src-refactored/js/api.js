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
 * Get feed (public or following)
 * @param {string} type - 'public' or 'following'
 * @returns {Promise<object[]>} - Array of post objects
 */
export async function getFeed(type = 'public') {
    try {
        const data = await apiRequest(`/api/posts/feed?type=${type}`);
        return data.posts || [];
    } catch (error) {
        console.error('Failed to fetch feed:', error);
        showToast('Failed to load feed. Please try again.', 'error');
        throw error;
    }
}

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

// Export APIError for use in other modules
export { APIError };
