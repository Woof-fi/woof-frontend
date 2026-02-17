/**
 * Posts and Feed Functionality
 * Handles post creation, display, and interactions
 */

import { getAllDogs, getFeed, uploadImage, createPost as createPostAPI } from './api.js';
import { escapeHTML, generateUsername, isValidFileType, isValidFileSize, showToast } from './utils.js';
import { showLoading, hideLoading, showError, showFeedSkeleton, animateIn } from './ui.js';
import { getCurrentUser, isAuthenticated } from './auth.js';
import { openAuthModal } from './modals.js';

// Pagination state
let feedNextCursor = null;
let feedLoading = false;
let feedObserver = null;
let currentFeedType = 'public';

/**
 * Initialize feed tabs (For You / Following)
 * Sets up click handlers on .feed-tab buttons.
 */
export function initFeedTabs() {
    const tabs = document.querySelectorAll('.feed-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.dataset.feedType;
            if (type === currentFeedType) return;

            // Update active state
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Load the selected feed
            initFeed(type);
        });
    });
}

/**
 * Initialize feed
 * @param {string} type - 'public' or 'following'
 */
export async function initFeed(type = 'public') {
    const feedContainer = document.querySelector('#feed-container') || document.querySelector('#following') || document.querySelector('.content');
    if (!feedContainer) return;

    // Store current feed type for pagination
    currentFeedType = type;

    // Reset pagination state
    feedNextCursor = null;
    feedLoading = false;
    if (feedObserver) {
        feedObserver.disconnect();
        feedObserver = null;
    }

    try {
        showFeedSkeleton(feedContainer);
        const result = await getFeed(type);
        if (result.posts && result.posts.length > 0) {
            renderPostFeed(result.posts, feedContainer);
            feedNextCursor = result.nextCursor;

            if (feedNextCursor) {
                setupInfiniteScroll(feedContainer);
            }
        } else if (type === 'following') {
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No posts from dogs you follow yet.</p>
                    <p>Follow some dogs to see their posts here!</p>
                </div>
            `;
        } else {
            // Fallback to showing dogs if no posts yet
            const dogs = await getAllDogs();
            renderFeed(dogs, feedContainer);
        }
    } catch (error) {
        console.error('Failed to load feed:', error);
        showError(feedContainer, 'Failed to load feed', () => initFeed(type));
    }
}

/**
 * Set up infinite scroll using IntersectionObserver.
 * Appends a sentinel element that triggers loading when scrolled into view.
 */
function setupInfiniteScroll(container) {
    // Remove any existing sentinel
    const existing = container.querySelector('.feed-sentinel');
    if (existing) existing.remove();

    const sentinel = document.createElement('div');
    sentinel.className = 'feed-sentinel';
    container.appendChild(sentinel);

    feedObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMorePosts();
        }
    }, { rootMargin: '200px' }); // Start loading 200px before the sentinel is visible

    feedObserver.observe(sentinel);
}

/**
 * Load the next page of posts (triggered by infinite scroll)
 */
async function loadMorePosts() {
    if (feedLoading || !feedNextCursor) return;

    const feedContainer = document.querySelector('#feed-container') || document.querySelector('#following') || document.querySelector('.content');
    if (!feedContainer) return;

    feedLoading = true;

    // Show loading spinner at the bottom
    const sentinel = feedContainer.querySelector('.feed-sentinel');
    if (sentinel) {
        sentinel.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        const result = await getFeed(currentFeedType, feedNextCursor);

        if (result.posts && result.posts.length > 0) {
            // Insert posts before the sentinel
            appendPosts(result.posts, feedContainer, sentinel);
            feedNextCursor = result.nextCursor;
        }

        if (!feedNextCursor) {
            // No more posts — remove sentinel and disconnect observer
            if (sentinel) sentinel.remove();
            if (feedObserver) {
                feedObserver.disconnect();
                feedObserver = null;
            }
        } else if (sentinel) {
            sentinel.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to load more posts:', error);
        if (sentinel) sentinel.innerHTML = '';
    } finally {
        feedLoading = false;
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

    // DOM methods (textContent, createTextNode) are used below,
    // which are inherently XSS-safe - no need for escapeHTML()
    const username = postData.username;
    const caption = postData.caption;
    const location = postData.location || '';

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

    // Wrap avatar + username in a link to the dog's profile
    if (postData.dogSlug) {
        const profileLink = document.createElement('a');
        profileLink.href = `/dog/${postData.dogSlug}`;
        profileLink.setAttribute('data-link', '');
        profileLink.className = 'post-author-link';
        profileLink.appendChild(profileImg);
        profileLink.appendChild(usernameStrong);
        postHeader.appendChild(profileLink);
    } else {
        postHeader.appendChild(profileImg);
        postHeader.appendChild(usernameStrong);
    }

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
 * Render posts from API (replaces container contents)
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

    appendPosts(posts, container);
}

/**
 * Append posts to the container (for pagination)
 * @param {object[]} posts - Array of post objects from API
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement|null} beforeElement - Insert before this element (for infinite scroll sentinel)
 */
function appendPosts(posts, container, beforeElement = null) {
    posts.forEach(post => {
        const postElement = createPostElement({
            profilePic: post.dogPhoto || '/assets/images/dog_profile_pic.jpg',
            username: post.dogName || 'Unknown Dog',
            imageUrl: post.imageUrl,
            caption: post.caption,
            location: post.dogLocation,
            dogSlug: post.dogSlug
        });
        if (beforeElement) {
            container.insertBefore(postElement, beforeElement);
        } else {
            container.appendChild(postElement);
        }
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
 * @returns {Promise<boolean>} true if post was created, false on validation failure
 */
export async function createPost(formData) {
    const imageFile = formData.get('post-image');
    const caption = formData.get('post-caption') || ''; // Caption is optional
    const dogId = formData.get('post-dog-select');

    // Check authentication
    if (!isAuthenticated()) {
        showToast('Please login to create a post', 'error');
        return false;
    }

    // Validate dog selection
    if (!dogId) {
        showToast('Please select a dog', 'error');
        return false;
    }

    // Validate image file
    if (!imageFile || !imageFile.size) {
        showToast('Please select an image', 'error');
        return false;
    }

    if (!isValidFileType(imageFile)) {
        showToast('Please upload a valid image file (JPG, PNG, GIF, WebP)', 'error');
        return false;
    }

    if (!isValidFileSize(imageFile, 5)) {
        showToast('Image size must be less than 5MB', 'error');
        return false;
    }

    try {
        // Show uploading message
        showToast('Uploading image...', 'info');

        // Upload image to S3
        const imageUrl = await uploadImage(imageFile);

        // Create post in database
        const post = await createPostAPI(dogId, imageUrl, caption);

        showToast('Post created successfully!', 'success');

        // Reload the feed to show the new post
        await initFeed();
        return true;
    } catch (error) {
        console.error('Failed to create post:', error);
        showToast('Failed to create post. Please try again.', 'error');
        return false;
    }
}
