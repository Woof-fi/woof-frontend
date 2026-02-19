/**
 * Post Detail View
 * Full post page with all comments
 */

import { getPost, getComments } from '../api.js';
import { createPostElement } from '../posts.js';
import { showToast, escapeHTML, timeAgo } from '../utils.js';
import router from '../router.js';

export class PostDetailView {
    constructor() {
        this.name = 'post-detail';
        this.postId = null;
    }

    getHTML(data = {}) {
        this.postId = data.params?.id || '';

        return `
            <main class="post-detail-page">
                <div class="post-detail-header">
                    <button class="back-btn" id="post-back-btn" aria-label="Go back">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Post</h2>
                </div>
                <div class="post-detail-container" id="post-detail-container">
                    <div class="post-detail-loading">
                        <i class="fas fa-spinner fa-spin"></i> Loading...
                    </div>
                </div>
            </main>
        `;
    }

    async onMount(data = {}) {
        const postId = data.params?.id || '';
        if (!postId) {
            router.navigate('/');
            return;
        }

        // Wire up back button
        const backBtn = document.getElementById('post-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    router.navigate('/');
                }
            });
        }

        const container = document.getElementById('post-detail-container');
        if (!container) return;

        try {
            const post = await getPost(postId);

            container.innerHTML = '';

            // Reuse the same post card rendering from posts.js
            const postElement = createPostElement({
                id: post.id,
                profilePic: post.dogPhoto || '/assets/images/dog_profile_pic.jpg',
                username: post.dogName || 'Unknown Dog',
                imageUrl: post.imageUrl,
                caption: post.caption,
                location: post.dogLocation,
                dogSlug: post.dogSlug,
                likeCount: post.likeCount,
                commentCount: post.commentCount,
                likedByUser: post.likedByUser,
                createdAt: post.createdAt,
            });

            container.appendChild(postElement);

            // Auto-expand comments if there are any
            if (post.commentCount > 0) {
                const viewAllLink = postElement.querySelector('.view-all-comments');
                if (viewAllLink) {
                    viewAllLink.click();
                }
            }
        } catch (error) {
            console.error('Failed to load post:', error);
            if (error.status === 404) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Post not found.</p>
                        <a href="/" data-link class="btn-primary" style="display:inline-block;margin-top:12px;">Go to Feed</a>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load post.</p>
                    </div>
                `;
            }
        }
    }

    onUnmount() {
        // Cleanup if needed
    }
}

export default new PostDetailView();
