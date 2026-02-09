/**
 * API Type Definitions
 * Type-safe interfaces for all API responses and requests
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
    id: string;
    email: string;
    name: string;
    profilePhoto?: string | null;
    bio?: string | null;
    location?: string | null;
    createdAt: string;
    dogs: Dog[];
    primaryDogId: string | null;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// ============================================================================
// DOG TYPES
// ============================================================================

export interface Dog {
    id: string;
    name: string;
    breed: string;
    age: number;
    profilePhoto: string | null;
    location: string;
    bio: string | null;
    ownerId: string;
}

export interface CreateDogRequest {
    name: string;
    breed: string;
    age: number;
    location: string;
    bio?: string;
    profile_photo?: string;
}

export interface UpdateDogRequest extends Partial<CreateDogRequest> {}

// ============================================================================
// POST TYPES
// ============================================================================

export interface Post {
    id: string;
    dogId: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
    updatedAt?: string;
    dogName: string;
    dogPhoto: string | null;
    dogLocation?: string;
    ownerName: string;
    ownerId: string;
}

export interface CreatePostRequest {
    dog_id: string;
    image_url: string;
    caption?: string;
}

export interface FeedResponse {
    posts: Post[];
    total: number;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface PresignedUrlRequest {
    filename: string;
    contentType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

export interface PresignedUrlResponse {
    uploadUrl: string;
    publicUrl: string;
    key: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface APIError {
    error: string;
    message?: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
    requestId?: string;
}

// ============================================================================
// GENERIC RESPONSE TYPES
// ============================================================================

export interface DogResponse {
    dog: Dog;
}

export interface DogsResponse {
    dogs: Dog[];
    total: number;
}

export interface PostResponse {
    post: Post;
}

export interface HealthResponse {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    dependencies: {
        database: string;
        s3: string;
    };
}
