/**
 * Posts and Feed Functionality
 * Handles post creation, display, and interactions
 */

import { getAllDogs, getFeed, uploadImage, createPost as createPostAPI } from './api.js';
import { escapeHTML, generateUsername, isValidFileType, isValidFileSize, showToast } from './utils.js';
import { showLoading, hideLoading, showError, showFeedSkeleton, animateIn } from './ui.js';
import { getCurrentUser, isAuthenticated } from './auth.js';
import { openAuthModal } from './modals.js';

/**
 * Initialize feed
 */
export async function initFeed() {
    const feedContainer = document.querySelector('#following') || document.querySelector('.content');
    if (!feedContainer) return;

    try {
        showFeedSkeleton(feedContainer);
        // Try to load real posts first
        const posts = await getFeed('public');
        if (posts && posts.length > 0) {
            renderPostFeed(posts, feedContainer);
        } else {
            // Fallback to showing dogs if no posts yet
            const dogs = await getAllDogs();
            renderFeed(dogs, feedContainer);
        }
    } catch (error) {
        console.error('Failed to load feed:', error);
        showError(feedContainer, 'Failed to load feed', () => initFeed());
    }
}

/**
 * Render feed with dog posts
 * @param {object[]} dogs - Array of dog objects
 * @param {HTMLElement} container - Container element
 */
function renderFeed(dogs, container) {
    container.innerHTML = '';

    if (dogs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No posts yet. Be the first to share!</p>
            </div>
        `;
        return;
    }

    // Create mock posts from dogs (until we have real posts API)
    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23cccccc" width="150" height="150"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDog%3C/text%3E%3C/svg%3E';

    dogs.forEach(dog => {
        const post = createPostElement({
            profilePic: dog.profilePhoto || placeholderImage,
            username: dog.name,
            imageUrl: dog.profilePhoto || placeholderImage,
            caption: dog.bio || 'No caption',
            location: dog.location
        });
        container.appendChild(post);
        animateIn(post);
    });

    // Bind like buttons
    bindLikeButtons();
}

/**
 * Create post element (SECURE VERSION - prevents XSS)
 * @param {object} postData - Post data
 * @returns {HTMLElement} - Post element
 */
function createPostElement(postData) {
    const post = document.createElement('div');
    post.className = 'post';

    // Security: Escape all user-generated content
    const username = escapeHTML(postData.username);
    const caption = escapeHTML(postData.caption);
    const location = postData.location ? escapeHTML(postData.location) : '';

    // Create elements using DOM methods (safer than innerHTML)
    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';

    const profileImg = document.createElement('img');
    profileImg.src = postData.profilePic || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23cccccc" width="150" height="150"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDog%3C/text%3E%3C/svg%3E';
    profileImg.alt = `${username}'s profile picture`;
    profileImg.onerror = function() {
        // Use SVG data URI as fallback - will never fail
        const fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23cccccc" width="150" height="150"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDog%3C/text%3E%3C/svg%3E';
        if (this.src !== fallback) {
            this.src = fallback;
        }
    };

    const usernameStrong = document.createElement('strong');
    usernameStrong.textContent = username;

    postHeader.appendChild(profileImg);
    postHeader.appendChild(usernameStrong);

    if (location) {
        const locationSpan = document.createElement('span');
        locationSpan.className = 'post-location';
        locationSpan.textContent = location;
        postHeader.appendChild(locationSpan);
    }

    const postImage = document.createElement('div');
    postImage.className = 'post-image';
    const img = document.createElement('img');
    img.src = postData.imageUrl;
    img.alt = `Post by ${username}`;
    img.loading = 'lazy';
    img.onerror = function() {
        // Use SVG data URI as fallback - will never fail
        const fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23cccccc" width="400" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
        if (this.src !== fallback) {
            this.src = fallback;
        }
    };
    postImage.appendChild(img);

    const postActions = document.createElement('div');
    postActions.className = 'post-actions';
    postActions.innerHTML = `
        <button class="like-button" aria-label="Like post">
            <i class="far fa-heart"></i>
        </button>
        <button aria-label="Comment on post">
            <i class="far fa-comment"></i>
        </button>
        <button aria-label="Share post">
            <i class="far fa-paper-plane"></i>
        </button>
    `;

    const postCaption = document.createElement('div');
    postCaption.className = 'post-caption';
    const captionP = document.createElement('p');
    const captionUsername = document.createElement('strong');
    captionUsername.textContent = username;
    captionP.appendChild(captionUsername);
    captionP.appendChild(document.createTextNode(' ' + caption));
    postCaption.appendChild(captionP);

    // Assemble post
    post.appendChild(postHeader);
    post.appendChild(postImage);
    post.appendChild(postActions);
    post.appendChild(postCaption);

    return post;
}

/**
 * Render posts from API
 * @param {object[]} posts - Array of post objects from API
 * @param {HTMLElement} container - Container element
 */
function renderPostFeed(posts, container) {
    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No posts yet. Be the first to share!</p>
            </div>
        `;
        return;
    }

    posts.forEach(post => {
        const postElement = createPostElement({
            profilePic: post.dogPhoto || 'assets/images/dog_profile_pic.jpg',
            username: post.dogName || 'Unknown Dog',
            imageUrl: post.imageUrl,
            caption: post.caption,
            location: post.dogLocation
        });
        container.appendChild(postElement);
        animateIn(postElement);
    });

    // Bind like buttons
    bindLikeButtons();
}

/**
 * Bind like button functionality
 */
function bindLikeButtons() {
    document.querySelectorAll('.like-button').forEach(button => {
        // Remove existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Add new listener
        newButton.addEventListener('click', function() {
            // Check authentication
            if (!isAuthenticated()) {
                showToast('Please login to like posts', 'error');
                openAuthModal();
                return;
            }

            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');

                // Animate
                if (this.classList.contains('liked')) {
                    this.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 200);
                }
            }
        });
    });
}

/**
 * Handle post creation
 * @param {FormData} formData - Form data with image and caption
 * @returns {Promise<void>}
 */
export async function createPost(formData) {
    const imageFile = formData.get('post-image');
    const caption = formData.get('post-caption');

    // Check authentication
    if (!isAuthenticated()) {
        showToast('Please login to create a post', 'error');
        return;
    }

    // Validate file
    if (!imageFile || !caption) {
        showToast('Please provide both an image and caption', 'error');
        return;
    }

    if (!isValidFileType(imageFile)) {
        showToast('Please upload a valid image file (JPG, PNG, GIF, WebP)', 'error');
        return;
    }

    if (!isValidFileSize(imageFile, 5)) {
        showToast('Image size must be less than 5MB', 'error');
        return;
    }

    // Get current user's dog (for now, we'll need the user to have created a dog first)
    const user = getCurrentUser();
    if (!user || !user.primaryDogId) {
        showToast('Please create a dog profile first', 'error');
        return;
    }

    try {
        // Show uploading message
        showToast('Uploading image...', 'info');

        // Upload image to S3
        const imageUrl = await uploadImage(imageFile);

        // Create post in database
        const post = await createPostAPI(user.primaryDogId, imageUrl, caption);

        showToast('Post created successfully!', 'success');

        // Reload the feed to show the new post
        await initFeed();
    } catch (error) {
        console.error('Failed to create post:', error);
        // Error message already shown by API functions
    }
}

/**
 * Initialize feed tabs
 */
export function initFeedTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            this.classList.add('active');
            const tabId = this.dataset.tab;
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');

                // Load content if not loaded
                if (tabId === 'foryou' && tabContent.children.length === 0) {
                    loadForYouFeed(tabContent);
                }
            }
        });
    });
}

/**
 * Load "For You" feed
 * @param {HTMLElement} container - Container element
 */
async function loadForYouFeed(container) {
    try {
        showFeedSkeleton(container);
        // Load public feed (all posts)
        const posts = await getFeed('public');
        if (posts && posts.length > 0) {
            // Shuffle for "For You" algorithm
            const shuffled = [...posts].sort(() => Math.random() - 0.5);
            renderPostFeed(shuffled, container);
        } else {
            // Fallback to dogs if no posts
            const dogs = await getAllDogs();
            const shuffled = [...dogs].sort(() => Math.random() - 0.5);
            renderFeed(shuffled, container);
        }
    } catch (error) {
        console.error('Failed to load For You feed:', error);
        showError(container, 'Failed to load feed', () => loadForYouFeed(container));
    }
}
