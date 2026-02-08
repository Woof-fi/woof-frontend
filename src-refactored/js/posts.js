/**
 * Posts and Feed Functionality
 * Handles post creation, display, and interactions
 */

import { getAllDogs, uploadImage, createPost as createPostAPI } from './api.js';
import { escapeHTML, generateUsername, isValidFileType, isValidFileSize, showToast } from './utils.js';
import { showLoading, hideLoading, showError, showFeedSkeleton, animateIn } from './ui.js';
import { getCurrentUser, isAuthenticated } from './auth.js';

/**
 * Initialize feed
 */
export async function initFeed() {
    const feedContainer = document.querySelector('#following') || document.querySelector('.content');
    if (!feedContainer) return;

    try {
        showFeedSkeleton(feedContainer);
        const dogs = await getAllDogs();
        renderFeed(dogs, feedContainer);
    } catch (error) {
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
    dogs.forEach(dog => {
        const post = createPostElement({
            profilePic: dog.profilePhoto && dog.profilePhoto.startsWith('/')
                ? `assets/images${dog.profilePhoto}`
                : dog.profilePhoto || 'assets/images/dog_profile_pic.jpg',
            username: dog.name,
            imageUrl: dog.profilePhoto && dog.profilePhoto.startsWith('/')
                ? `assets/images${dog.profilePhoto}`
                : dog.profilePhoto || 'assets/images/dog_profile_pic.jpg',
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
    profileImg.src = postData.profilePic || 'assets/images/dog_profile_pic.jpg';
    profileImg.alt = `${username}'s profile picture`;
    profileImg.onerror = function() {
        if (this.src !== 'assets/images/dog_profile_pic.jpg') {
            this.src = 'assets/images/dog_profile_pic.jpg';
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
        if (this.src !== 'assets/images/dog_profile_pic.jpg') {
            this.src = 'assets/images/dog_profile_pic.jpg';
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
 * Bind like button functionality
 */
function bindLikeButtons() {
    document.querySelectorAll('.like-button').forEach(button => {
        // Remove existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Add new listener
        newButton.addEventListener('click', function() {
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

        // Add to feed UI
        const postElement = createPostElement({
            profilePic: user.dogPhoto || 'assets/images/dog_profile_pic.jpg',
            username: user.dogName || user.name,
            imageUrl: post.imageUrl,
            caption: post.caption,
            location: user.location
        });

        const feedContainer = document.querySelector('#following') || document.querySelector('.content');
        if (feedContainer) {
            feedContainer.prepend(postElement);
            animateIn(postElement);
        }

        // Rebind like buttons
        bindLikeButtons();
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
        const dogs = await getAllDogs();

        // Shuffle for "For You" algorithm
        const shuffled = [...dogs].sort(() => Math.random() - 0.5);
        renderFeed(shuffled, container);
    } catch (error) {
        showError(container, 'Failed to load feed', () => loadForYouFeed(container));
    }
}
