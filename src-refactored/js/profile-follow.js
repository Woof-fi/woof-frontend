/**
 * Profile Follow
 * Follow/unfollow button, message button, and follower/following counts.
 */

import { getFollowStatus, followDog, unfollowDog, startConversation, getFollowing } from './api.js';
import { isAuthenticated } from './auth.js';
import { showToast } from './utils.js';
// Router navigation via WoofApp global (set by App.svelte) or history API
function navigate(path) {
    if (window.WoofApp && typeof window.WoofApp.navigate === 'function') {
        window.WoofApp.navigate(path);
    } else {
        history.pushState({}, '', path);
        window.dispatchEvent(new CustomEvent('routechange'));
    }
}

/**
 * Load follower count for any profile (owner or visitor)
 * @param {string} dogId
 */
export async function loadFollowerCount(dogId) {
    const el = document.getElementById('follower-count');
    if (!el) return;
    try {
        const status = await getFollowStatus(dogId);
        el.textContent = status.followerCount ?? '—';
    } catch (error) {
        console.error('Failed to load follower count:', error);
    }
}

/**
 * Load following count for the given dog.
 * @param {string} dogId
 */
export async function loadFollowingCount(dogId) {
    const el = document.getElementById('following-count');
    if (!el || !dogId) return;
    try {
        const following = await getFollowing(dogId);
        el.textContent = following.length;
    } catch (error) {
        console.error('Failed to load following count:', error);
        el.textContent = '0';
    }
}

/**
 * Render the follow/message sticky footer and wire up all buttons for a non-owner profile.
 * @param {object} dog - Dog data object
 */
export function initFollowSection(dog) {
    const stickyEl = document.getElementById('profile-follow-sticky');
    if (stickyEl) {
        stickyEl.innerHTML = `
            <div class="profile-follow-actions">
                <button class="follow-btn" id="follow-btn" data-dog-id="${dog.id}" disabled>
                    <i class="fas fa-user-plus"></i> Follow
                </button>
                <button class="message-profile-btn icon-only" id="message-profile-btn"
                        data-dog-id="${dog.id}" title="Message" aria-label="Message">
                    <i class="fas fa-envelope"></i>
                </button>
            </div>
        `;
    }

    loadFollowerCount(dog.id);
    _loadFollowStatus(dog.id);
    _wireMessageButton(dog.id);
}

/**
 * @private
 */
async function _loadFollowStatus(dogId) {
    const followBtn = document.getElementById('follow-btn');
    const followerCountEl = document.getElementById('follower-count');

    try {
        const status = await getFollowStatus(dogId);

        if (followBtn) {
            followBtn.disabled = false;
            updateFollowButton(followBtn, status.isFollowing);

            followBtn.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    showToast('Please login to follow dogs', 'error');
                    return;
                }

                followBtn.disabled = true;
                const wasFollowing = followBtn.classList.contains('following');

                try {
                    if (wasFollowing) {
                        await unfollowDog(dogId);
                        updateFollowButton(followBtn, false);
                        if (followerCountEl) {
                            followerCountEl.textContent = Math.max(0, parseInt(followerCountEl.textContent) - 1);
                        }
                    } else {
                        await followDog(dogId);
                        updateFollowButton(followBtn, true);
                        if (followerCountEl) {
                            followerCountEl.textContent = parseInt(followerCountEl.textContent) + 1;
                        }
                    }
                } catch (error) {
                    console.error('Follow action failed:', error);
                    showToast('Failed to update follow status', 'error');
                } finally {
                    followBtn.disabled = false;
                }
            });
        }
    } catch (error) {
        console.error('Failed to load follow status:', error);
        if (followBtn) followBtn.disabled = false;
    }
}

/**
 * @private
 */
function _wireMessageButton(dogId) {
    const messageBtn = document.getElementById('message-profile-btn');
    if (!messageBtn) return;

    messageBtn.addEventListener('click', async () => {
        if (!isAuthenticated()) {
            showToast('Please login to send messages', 'error');
            return;
        }
        messageBtn.disabled = true;
        try {
            const result = await startConversation(dogId);
            navigate(`/messages/${result.conversationId}`);
        } catch (error) {
            console.error('Failed to start conversation:', error);
            showToast('Failed to start conversation', 'error');
        } finally {
            messageBtn.disabled = false;
        }
    });
}

/**
 * Update follow button appearance
 * @param {HTMLElement} btn
 * @param {boolean} isFollowing
 */
export function updateFollowButton(btn, isFollowing) {
    if (isFollowing) {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fas fa-user-check"></i> Following';
    } else {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
    }
}
