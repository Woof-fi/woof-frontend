/**
 * API Service Layer
 * Centralized API calls with error handling and timeouts
 */

import { CONFIG } from './config';
import { showToast } from './utils';
import { getToken } from './auth';
import type {
    Dog,
    Post,
    DogsResponse,
    DogResponse,
    FeedResponse,
    PostResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
    HealthResponse,
    APIError as APIErrorData
} from '../types/api';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
    status: number;
    data: APIErrorData | null;

    constructor(message: string, status: number, data: APIErrorData | null = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Make API request with timeout and error handling
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

        return data as T;
    } catch (error) {
        clearTimeout(timeout);

        if (error instanceof Error && error.name === 'AbortError') {
            throw new APIError('Request timeout', 408, null);
        }

        if (error instanceof APIError) {
            throw error;
        }

        // Network error
        throw new APIError('Network error', 0, null);
    }
}

// ============================================================================
// DOG ENDPOINTS
// ============================================================================

/**
 * Get all dogs
 */
export async function getAllDogs(): Promise<Dog[]> {
    try {
        const data = await apiRequest<DogsResponse>('/api/dogs');
        return data.dogs || [];
    } catch (error) {
        console.error('Failed to fetch dogs:', error);
        showToast('Failed to load dogs. Please try again.', 'error');
        throw error;
    }
}

/**
 * Get current user's dogs (requires authentication)
 */
export async function getMyDogs(): Promise<Dog[]> {
    try {
        const data = await apiRequest<DogsResponse>('/api/dogs/my/dogs');
        return data.dogs || [];
    } catch (error) {
        console.error('Failed to fetch my dogs:', error);
        // Don't show toast for this - it's used for navigation logic
        return [];
    }
}

/**
 * Get dog by ID
 */
export async function getDog(id: string): Promise<Dog> {
    try {
        const data = await apiRequest<DogResponse>(`/api/dogs/${id}`);
        return data.dog;
    } catch (error) {
        console.error(`Failed to fetch dog ${id}:`, error);
        if (error instanceof APIError && error.status === 404) {
            showToast('Dog not found.', 'error');
        } else {
            showToast('Failed to load dog profile. Please try again.', 'error');
        }
        throw error;
    }
}

/**
 * Create new dog
 */
export async function createDog(dogData: {
    name: string;
    breed: string;
    age: number;
    location: string;
    bio?: string;
    profile_photo?: string;
}): Promise<Dog> {
    try {
        const data = await apiRequest<DogResponse>('/api/dogs', {
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
 */
export async function updateDog(id: string, dogData: Partial<{
    name: string;
    breed: string;
    age: number;
    location: string;
    bio: string;
    profile_photo: string;
}>): Promise<Dog> {
    try {
        const data = await apiRequest<DogResponse>(`/api/dogs/${id}`, {
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
 */
export async function deleteDog(id: string): Promise<void> {
    try {
        await apiRequest<void>(`/api/dogs/${id}`, {
            method: 'DELETE'
        });
        showToast('Profile deleted successfully.', 'success');
    } catch (error) {
        console.error(`Failed to delete dog ${id}:`, error);
        showToast('Failed to delete profile. Please try again.', 'error');
        throw error;
    }
}

// ============================================================================
// POST ENDPOINTS
// ============================================================================

/**
 * Create a new post
 */
export async function createPost(dogId: string, imageUrl: string, caption?: string): Promise<Post> {
    try {
        const data = await apiRequest<PostResponse>('/api/posts', {
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
 */
export async function getFeed(type: 'public' | 'following' = 'public'): Promise<Post[]> {
    try {
        const data = await apiRequest<FeedResponse>(`/api/posts/feed?type=${type}`);
        return data.posts || [];
    } catch (error) {
        console.error('Failed to fetch feed:', error);
        showToast('Failed to load feed. Please try again.', 'error');
        throw error;
    }
}

// ============================================================================
// UPLOAD ENDPOINTS
// ============================================================================

/**
 * Upload image to S3
 */
export async function uploadImage(file: File): Promise<string> {
    try {
        // Get presigned URL from backend
        const urlData = await apiRequest<PresignedUrlResponse>('/api/upload/presigned-url', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type
            } as PresignedUrlRequest)
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
// HEALTH CHECK
// ============================================================================

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
    try {
        const data = await apiRequest<HealthResponse>('/health');
        return data.status === 'OK';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
