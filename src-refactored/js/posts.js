/**
 * Posts and Feed Functionality
 * Handles post creation, display, and interactions
 */

import { getAllDogs, getFeed, uploadImage, createPost as createPostAPI, likePost, unlikePost, createComment, getComments } from './api.js';
import { escapeHTML, generateUsername, isValidFileType, isValidFileSize, showToast, timeAgo } from './utils.js';
import { showLoading, hideLoading, showError, showFeedSkeleton, animateIn } from './ui.js';
import { getCurrentUser, isAuthenticated } from './auth.js';
import { openAuthModal } from './modals.js';

// Pagination state
let feedNextCursor = null;
let feedLoading = false;
let feedObserver = null;
let currentFeedType = 'public';

// Invite card tracking
let totalPostsRendered = 0;
const INVITE_FIRST_POSITION = 5;
const INVITE_INTERVAL = 20;

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
    totalPostsRendered = 0;
    if (feedObserver) {
        feedObserver.disconnect();
        feedObserver = null;
    }

    try {
        showFeedSkeleton(feedContainer);
        const result = await getFeed(type);
        if (result.posts && result.posts.length > 0) {
            const GATE_POST_LIMIT = 4;
            const postsToShow = !isAuthenticated()
                ? result.posts.slice(0, GATE_POST_LIMIT)
                : result.posts;

            renderPostFeed(postsToShow, feedContainer);
            feedNextCursor = result.nextCursor;

            if (!isAuthenticated()) {
                insertContentGate(feedContainer);
            } else if (feedNextCursor) {
                setupInfiniteScroll(feedContainer);
            }
        } else if (type === 'following') {
            if (!isAuthenticated()) {
                feedContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <p>Sign up to follow dogs and see their posts here!</p>
                    </div>
                `;
            } else {
                feedContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <p>Your following feed is empty.</p>
                        <p>Follow dogs from the <strong>For You</strong> tab to see their posts here!</p>
                    </div>
                `;
            }
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
export function createPostElement(postData) {
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

    const postId = postData.id;
    const likeCount = postData.likeCount || 0;
    const likedByUser = postData.likedByUser || false;

    const commentCount = postData.commentCount || 0;

    const postActions = document.createElement('div');
    postActions.className = 'post-actions';

    const likeButton = document.createElement('button');
    likeButton.className = 'like-button' + (likedByUser ? ' liked' : '');
    likeButton.setAttribute('aria-label', likedByUser ? 'Unlike post' : 'Like post');
    if (postId) likeButton.dataset.postId = postId;

    const likeIcon = document.createElement('i');
    likeIcon.className = likedByUser ? 'fas fa-heart' : 'far fa-heart';
    likeButton.appendChild(likeIcon);

    const likeCountSpan = document.createElement('span');
    likeCountSpan.className = 'like-count';
    likeCountSpan.textContent = likeCount > 0 ? String(likeCount) : '';

    const commentButton = document.createElement('button');
    commentButton.className = 'comment-button';
    commentButton.setAttribute('aria-label', 'Comment on post');
    const commentIcon = document.createElement('i');
    commentIcon.className = 'far fa-comment';
    commentButton.appendChild(commentIcon);

    const commentCountSpan = document.createElement('span');
    commentCountSpan.className = 'comment-count';
    commentCountSpan.textContent = commentCount > 0 ? String(commentCount) : '';

    postActions.appendChild(likeButton);
    postActions.appendChild(likeCountSpan);
    postActions.appendChild(commentButton);
    postActions.appendChild(commentCountSpan);

    let postCaption = null;
    if (caption) {
        postCaption = document.createElement('div');
        postCaption.className = 'post-caption';
        const captionP = document.createElement('p');
        const captionUsername = document.createElement('strong');
        captionUsername.textContent = username;
        captionP.appendChild(captionUsername);
        captionP.appendChild(document.createTextNode(' ' + caption));
        postCaption.appendChild(captionP);
    }

    // Comments section — only visible to logged-in users
    const commentsSection = document.createElement('div');
    commentsSection.className = 'post-comments-section';

    if (isAuthenticated()) {
        if (commentCount > 0 && postId) {
            const viewAllLink = document.createElement('a');
            viewAllLink.className = 'view-all-comments';
            viewAllLink.href = '#';
            viewAllLink.textContent = commentCount === 1
                ? 'View 1 comment'
                : `View all ${commentCount} comments`;
            viewAllLink.addEventListener('click', (e) => {
                e.preventDefault();
                toggleComments(postId, commentsSection);
            });
            commentsSection.appendChild(viewAllLink);
        }

        const commentsList = document.createElement('div');
        commentsList.className = 'comments-list';
        commentsList.dataset.postId = postId || '';
        commentsSection.appendChild(commentsList);

        // Comment input (always visible for logged-in users, Instagram-style)
        if (postId) {
            const commentForm = document.createElement('div');
            commentForm.className = 'comment-form';

            const commentInput = document.createElement('input');
            commentInput.type = 'text';
            commentInput.className = 'comment-input';
            commentInput.placeholder = 'Add a comment...';
            commentInput.maxLength = 2200;

            const postCommentBtn = document.createElement('button');
            postCommentBtn.className = 'comment-submit';
            postCommentBtn.textContent = 'Post';
            postCommentBtn.disabled = true;

            commentInput.addEventListener('input', () => {
                postCommentBtn.disabled = !commentInput.value.trim();
            });

            const submitComment = async () => {
                const content = commentInput.value.trim();
                if (!content || !postId) return;

                postCommentBtn.disabled = true;
                try {
                    const result = await createComment(postId, content);
                    commentInput.value = '';

                    // Add the new comment to the list
                    const commentEl = createCommentElement(result.comment);
                    commentsList.prepend(commentEl);

                    // Update comment count
                    const countSpan = post.querySelector('.comment-count');
                    if (countSpan) {
                        countSpan.textContent = result.commentCount > 0 ? String(result.commentCount) : '';
                    }

                    // Update "view all" link
                    const viewAll = commentsSection.querySelector('.view-all-comments');
                    if (viewAll) {
                        viewAll.textContent = result.commentCount === 1
                            ? 'View 1 comment'
                            : `View all ${result.commentCount} comments`;
                    }
                } catch (error) {
                    console.error('Failed to post comment:', error);
                    showToast('Failed to post comment', 'error');
                    postCommentBtn.disabled = false;
                }
            };

            postCommentBtn.addEventListener('click', submitComment);
            commentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !postCommentBtn.disabled) {
                    submitComment();
                }
            });

            commentForm.appendChild(commentInput);
            commentForm.appendChild(postCommentBtn);
            commentsSection.appendChild(commentForm);
        }

        // Wire comment button to focus the input
        commentButton.addEventListener('click', () => {
            const input = commentsSection.querySelector('.comment-input');
            if (input) input.focus();
        });
    } else {
        // Not logged in — clicking comment button opens login modal
        commentButton.addEventListener('click', () => {
            openAuthModal();
        });
    }

    // Assemble post
    post.appendChild(postHeader);
    post.appendChild(postImage);
    post.appendChild(postActions);
    if (postCaption) post.appendChild(postCaption);
    post.appendChild(commentsSection);

    if (postData.createdAt) {
        const timestampContainer = document.createElement('div');
        timestampContainer.className = 'post-timestamp-container';
        const timestamp = document.createElement('time');
        timestamp.className = 'post-timestamp';
        const createdDate = new Date(postData.createdAt);
        timestamp.dateTime = createdDate.toISOString();
        timestamp.textContent = timeAgo(postData.createdAt);
        timestamp.title = createdDate.toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
        timestamp.style.cursor = 'pointer';
        timestamp.addEventListener('click', () => {
            const isRelative = timestamp.dataset.showing !== 'full';
            if (isRelative) {
                timestamp.textContent = createdDate.toLocaleString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                });
                timestamp.dataset.showing = 'full';
            } else {
                timestamp.textContent = timeAgo(postData.createdAt);
                timestamp.dataset.showing = 'relative';
            }
        });
        timestampContainer.appendChild(timestamp);
        post.appendChild(timestampContainer);
    }

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
            createdAt: post.createdAt
        });
        if (beforeElement) {
            container.insertBefore(postElement, beforeElement);
        } else {
            container.appendChild(postElement);
        }
        animateIn(postElement);

        totalPostsRendered++;

        // Insert invite card at specific intervals (logged-in users only)
        if (isAuthenticated() && shouldShowInviteCard(totalPostsRendered)) {
            const inviteCard = createInviteCard();
            if (beforeElement) {
                container.insertBefore(inviteCard, beforeElement);
            } else {
                container.appendChild(inviteCard);
            }
            animateIn(inviteCard);
        }
    });

    // Bind like buttons
    bindLikeButtons();
}

/**
 * Check if an invite card should be shown after this post position
 * @param {number} position - 1-based post position
 * @returns {boolean}
 */
function shouldShowInviteCard(position) {
    if (position === INVITE_FIRST_POSITION) return true;
    if (position > INVITE_FIRST_POSITION && (position - INVITE_FIRST_POSITION) % INVITE_INTERVAL === 0) return true;
    return false;
}

/**
 * Copy text to clipboard with fallback for non-secure contexts (HTTP)
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Whether the copy succeeded
 */
function copyToClipboard(text) {
    // Modern API (requires HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    // Legacy fallback for HTTP
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return Promise.resolve(success);
    } catch {
        document.body.removeChild(textarea);
        return Promise.resolve(false);
    }
}

/**
 * Copy site URL to clipboard and show visual feedback on button
 * @param {HTMLElement} btn - Button to update with feedback
 */
async function copyToClipboardFallback(btn) {
    const success = await copyToClipboard(window.location.origin);
    if (success) {
        showToast('Link copied!', 'success');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '';
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check';
        btn.appendChild(checkIcon);
        btn.appendChild(document.createTextNode(' Copied!'));
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    } else {
        showToast('Failed to copy link', 'error');
    }
}

/**
 * Create an invite card element for the feed
 * @returns {HTMLElement}
 */
function createInviteCard() {
    const card = document.createElement('div');
    card.className = 'invite-card';

    const icon = document.createElement('div');
    icon.className = 'invite-card-icon';
    const iconEl = document.createElement('i');
    iconEl.className = 'fas fa-envelope-open-text';
    icon.appendChild(iconEl);

    const heading = document.createElement('h3');
    heading.className = 'invite-card-heading';
    heading.textContent = 'Know a good boy or girl?';

    const desc = document.createElement('p');
    desc.className = 'invite-card-desc';
    desc.textContent = 'Invite your friends and their dogs to join the pack!';

    const actions = document.createElement('div');
    actions.className = 'invite-card-actions';

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-primary invite-card-btn';
    const shareIcon = document.createElement('i');
    shareIcon.className = 'fas fa-share-alt';
    shareBtn.appendChild(shareIcon);
    shareBtn.appendChild(document.createTextNode(' Share'));

    shareBtn.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Woof!',
                    text: 'Come join the social network for dogs!',
                    url: window.location.origin
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    copyToClipboardFallback(shareBtn);
                }
            }
        } else {
            copyToClipboardFallback(shareBtn);
        }
    });

    actions.appendChild(shareBtn);

    card.appendChild(icon);
    card.appendChild(heading);
    card.appendChild(desc);
    card.appendChild(actions);

    return card;
}

/**
 * Insert a content gate for unauthenticated users
 * @param {HTMLElement} container - Feed container
 */
function insertContentGate(container) {
    const gate = document.createElement('div');
    gate.className = 'content-gate';

    const overlay = document.createElement('div');
    overlay.className = 'content-gate-overlay';

    const content = document.createElement('div');
    content.className = 'content-gate-content';

    const icon = document.createElement('div');
    icon.className = 'content-gate-icon';
    const iconEl = document.createElement('i');
    iconEl.className = 'fas fa-lock';
    icon.appendChild(iconEl);

    const heading = document.createElement('h2');
    heading.className = 'content-gate-heading';
    heading.textContent = 'Want to see more?';

    const desc = document.createElement('p');
    desc.className = 'content-gate-desc';
    desc.textContent = "Sign up to browse the full feed, follow dogs, and share your own pup's adventures.";

    const btnGroup = document.createElement('div');
    btnGroup.className = 'content-gate-buttons';

    const signupBtn = document.createElement('button');
    signupBtn.className = 'btn-primary content-gate-btn';
    signupBtn.textContent = 'Sign Up';
    signupBtn.addEventListener('click', () => {
        openAuthModal();
        const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
        if (registerTab) registerTab.click();
    });

    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn-secondary content-gate-btn';
    loginBtn.textContent = 'Log In';
    loginBtn.addEventListener('click', () => {
        openAuthModal();
    });

    btnGroup.appendChild(signupBtn);
    btnGroup.appendChild(loginBtn);

    content.appendChild(icon);
    content.appendChild(heading);
    content.appendChild(desc);
    content.appendChild(btnGroup);

    overlay.appendChild(content);
    gate.appendChild(overlay);
    container.appendChild(gate);
}

// Re-initialize feed when auth state changes (removes content gate after login)
window.addEventListener('auth-state-changed', () => {
    const feedContainer = document.querySelector('#feed-container');
    if (feedContainer) {
        initFeed(currentFeedType);
    }
});

/**
 * Bind like button functionality
 */
function bindLikeButtons() {
    document.querySelectorAll('.like-button').forEach(button => {
        // Skip if already bound
        if (button.dataset.bound) return;
        button.dataset.bound = 'true';

        button.addEventListener('click', async function() {
            // Check authentication
            if (!isAuthenticated()) {
                showToast('Please login to like posts', 'error');
                openAuthModal();
                return;
            }

            const postId = this.dataset.postId;
            if (!postId) return;

            const isLiked = this.classList.contains('liked');
            const icon = this.querySelector('i');
            const countSpan = this.parentElement.querySelector('.like-count');

            // Optimistic UI update
            this.classList.toggle('liked');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }

            // Animate on like
            if (!isLiked) {
                this.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
            }

            try {
                let result;
                if (isLiked) {
                    result = await unlikePost(postId);
                } else {
                    result = await likePost(postId);
                }
                // Update count from server
                if (countSpan && result.likeCount !== undefined) {
                    countSpan.textContent = result.likeCount > 0 ? String(result.likeCount) : '';
                }
            } catch (error) {
                // Revert optimistic update on failure
                this.classList.toggle('liked');
                if (icon) {
                    icon.classList.toggle('far');
                    icon.classList.toggle('fas');
                }
                console.error('Like/unlike failed:', error);
            }
        });
    });
}

/**
 * Toggle comments visibility for a post — load from API on first expand
 * @param {string} postId - Post ID
 * @param {HTMLElement} section - Comments section container
 */
async function toggleComments(postId, section) {
    const list = section.querySelector('.comments-list');
    if (!list) return;

    // If already loaded, toggle visibility
    if (list.dataset.loaded === 'true') {
        list.style.display = list.style.display === 'none' ? '' : 'none';
        return;
    }

    // Load comments from API
    try {
        list.innerHTML = '<span class="comments-loading">Loading comments...</span>';
        const result = await getComments(postId, null, 20);

        list.innerHTML = '';
        result.comments.forEach(comment => {
            list.appendChild(createCommentElement(comment));
        });
        list.dataset.loaded = 'true';
    } catch (error) {
        console.error('Failed to load comments:', error);
        list.innerHTML = '<span class="comments-loading">Failed to load comments</span>';
    }
}

/**
 * Create a single comment element
 * @param {object} comment - Comment object from API
 * @returns {HTMLElement}
 */
function createCommentElement(comment) {
    const el = document.createElement('div');
    el.className = 'comment-item';

    const nameLink = document.createElement('a');
    nameLink.href = `/dog/${comment.dogSlug || comment.dogId}`;
    nameLink.setAttribute('data-link', '');
    nameLink.className = 'comment-author';

    const nameStrong = document.createElement('strong');
    nameStrong.textContent = comment.dogName;
    nameLink.appendChild(nameStrong);

    const contentSpan = document.createElement('span');
    contentSpan.className = 'comment-content';
    contentSpan.textContent = ' ' + comment.content;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'comment-time';
    timeSpan.textContent = timeAgo(comment.createdAt);

    el.appendChild(nameLink);
    el.appendChild(contentSpan);
    el.appendChild(timeSpan);

    return el;
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
