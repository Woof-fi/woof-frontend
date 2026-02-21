/**
 * Profile Page Functionality
 * Handles dog profile display, edit button, and follow button
 */

import { getDog, getDogBySlug, getDogPosts, getFollowStatus, followDog, unfollowDog, getHealthRecords, deleteHealthRecord, startConversation, getFollowers, getFollowing } from './api.js';
import { showLoading, hideLoading, showError, showProfileSkeleton } from './ui.js';
import { escapeHTML, formatDate, showToast, timeAgo } from './utils.js';
import { isAuthenticated } from './auth.js';
import { openEditDogModal } from './edit-dog-modal.js';
import { openHealthRecordModal } from './health-record-modal.js';
import { showOnboardingTour, isOnboardingCompleted } from './onboarding-tour.js';
import router from './router.js';

// Store current dog data for edit modal
let currentDog = null;

/**
 * Initialize profile page
 * @param {string} slugOrId - Dog slug (e.g., 'nelli-1') or ID to load
 */
export async function initProfile(slugOrId) {
    // Support both SPA (.profile-container) and legacy (.profile) selectors
    const profileContainer = document.querySelector('.profile-container') || document.querySelector('.profile');
    if (!profileContainer) return;

    try {
        showProfileSkeleton(profileContainer);

        // Detect if parameter is a slug (contains dash) or ID (numeric)
        const dog = slugOrId.includes('-')
            ? await getDogBySlug(slugOrId)
            : await getDog(slugOrId);

        currentDog = dog;
        renderProfile(dog, profileContainer, slugOrId);

        // Show onboarding tour for new owners who haven't seen it
        if (dog.isOwner && !isOnboardingCompleted()) {
            // Short delay so profile renders first
            setTimeout(() => showOnboardingTour(dog.name), 500);
        }
    } catch (error) {
        showError(profileContainer, 'Failed to load profile', () => initProfile(slugOrId));
    }
}

/**
 * Render dog profile
 * @param {object} dog - Dog data
 * @param {HTMLElement} container - Container element
 * @param {string} slugOrId - Current slug/ID for reloading
 */
function renderProfile(dog, container, slugOrId) {
    // Security: Escape all user-generated content
    const name = escapeHTML(dog.name);
    const breed = escapeHTML(dog.breed);
    const location = dog.location ? escapeHTML(dog.location) : 'Unknown';
    const bio = dog.bio ? escapeHTML(dog.bio) : 'No bio yet';

    const profilePhoto = dog.profilePhoto || '/assets/images/dog_profile_pic.jpg';

    // Build action button HTML
    let nameRowAction = '';
    let profileActionsHtml = '';
    if (dog.isOwner) {
        nameRowAction = `
            <button class="edit-profile-btn" id="edit-profile-btn">
                <i class="fas fa-edit"></i> Edit Profile
            </button>
        `;
    } else {
        // Follow + Message on their own row below the header
        profileActionsHtml = `
            <div class="profile-actions">
                <button class="follow-btn" id="follow-btn" data-dog-id="${dog.id}" disabled>
                    <i class="fas fa-user-plus"></i> Follow
                </button>
                <button class="message-profile-btn" id="message-profile-btn" data-dog-id="${dog.id}">
                    <i class="fas fa-envelope"></i> Message
                </button>
            </div>
        `;
    }

    // Follower count
    const statsHtml = `
        <div class="profile-stats" id="profile-stats">
            <span><strong id="follower-count">-</strong> followers</span>
        </div>
    `;

    container.innerHTML = `
        <section class="profile">
            <div class="profile-header">
                <img src="${profilePhoto}"
                     alt="${name}'s Profile Picture"
                     class="profile-pic-large"
                     onerror="if(this.src!=='/assets/images/dog_profile_pic.jpg') this.src='/assets/images/dog_profile_pic.jpg'">
                <div class="profile-info">
                    <div class="profile-name-row">
                        <h3>${name}</h3>
                        ${nameRowAction}
                    </div>
                    ${statsHtml}
                    <p><strong>Breed:</strong> ${breed}</p>
                    <p><strong>Age:</strong> ${dog.age} years</p>
                    <p><strong>Location:</strong> ${location}</p>
                </div>
            </div>
            ${profileActionsHtml}
            <div class="profile-details">
                <h3>About</h3>
                <p>${bio}</p>
            </div>
        </section>
    `;

    // Wire up edit button
    if (dog.isOwner) {
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                openEditDogModal(dog, () => initProfile(slugOrId));
            });
        }
    }

    // Always load follower count
    if (dog.id) {
        loadFollowerCount(dog.id);
    }

    // Wire up follow button and load follow status
    if (!dog.isOwner && dog.id) {
        loadFollowStatus(dog.id);

        // Wire up message button
        const messageBtn = document.getElementById('message-profile-btn');
        if (messageBtn) {
            messageBtn.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    showToast('Please login to send messages', 'error');
                    return;
                }
                messageBtn.disabled = true;
                try {
                    const result = await startConversation(dog.id);
                    router.navigate(`/messages/${result.conversationId}`);
                } catch (error) {
                    console.error('Failed to start conversation:', error);
                    showToast('Failed to start conversation', 'error');
                } finally {
                    messageBtn.disabled = false;
                }
            });
        }
    }
}

/**
 * Load follower count for any profile (owner or visitor)
 * @param {string} dogId - Dog ID
 */
async function loadFollowerCount(dogId) {
    const followerCountEl = document.getElementById('follower-count');
    if (!followerCountEl) return;

    try {
        const status = await getFollowStatus(dogId);
        followerCountEl.textContent = status.followerCount;
    } catch (error) {
        console.error('Failed to load follower count:', error);
    }
}

/**
 * Load follow status and wire up follow/unfollow button
 * @param {string} dogId - Dog ID
 */
async function loadFollowStatus(dogId) {
    const followBtn = document.getElementById('follow-btn');
    const followerCountEl = document.getElementById('follower-count');

    try {
        const status = await getFollowStatus(dogId);

        // Update button state
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
        // Still enable button as fallback
        if (followBtn) followBtn.disabled = false;
    }
}

/**
 * Update follow button appearance
 * @param {HTMLElement} btn - Button element
 * @param {boolean} isFollowing - Whether currently following
 */
function updateFollowButton(btn, isFollowing) {
    if (isFollowing) {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fas fa-user-check"></i> Following';
    } else {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
    }
}

/**
 * Initialize profile tabs
 */
export function initProfileTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all tabs
            tabLinks.forEach(l => {
                l.classList.remove('active');
                l.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-hidden', 'true');
            });

            // Add active class to clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');

            // Show corresponding content
            const tabId = this.dataset.tab;
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.setAttribute('aria-hidden', 'false');
            }
        });
    });
}

/**
 * Load dog friends (mutual follows only)
 * @param {string} slugOrId - Dog slug or ID
 */
export async function loadFriends(slugOrId) {
    const friendsContainer = document.querySelector('#friends .friend-list');
    if (!friendsContainer) return;

    if (!currentDog) return;

    friendsContainer.innerHTML = `
        <div class="friends-loading">
            <i class="fas fa-spinner fa-spin"></i> Loading...
        </div>
    `;

    try {
        const [followers, following] = await Promise.all([
            getFollowers(currentDog.id),
            getFollowing(currentDog.id)
        ]);

        // Friends = mutual follows (in both followers AND following)
        const followingIds = new Set(following.map(d => d.id));
        const friends = followers
            .filter(dog => followingIds.has(dog.id))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (friends.length === 0) {
            friendsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No friends yet. Start connecting!</p>
                </div>
            `;
            return;
        }

        friendsContainer.innerHTML = '';

        friends.forEach(dog => {
            const li = document.createElement('li');
            li.className = 'friend-item';

            const link = document.createElement('a');
            link.href = `/dog/${dog.slug || dog.id}`;
            link.setAttribute('data-link', '');
            link.className = 'friend-link';

            const img = document.createElement('img');
            img.src = dog.profilePhoto || '/assets/images/dog_profile_pic.jpg';
            img.alt = escapeHTML(dog.name);
            img.className = 'friend-avatar';
            img.loading = 'lazy';
            img.onerror = function() {
                this.src = '/assets/images/dog_profile_pic.jpg';
            };

            const info = document.createElement('div');
            info.className = 'friend-info';

            const name = document.createElement('span');
            name.className = 'friend-name';
            name.textContent = dog.name;

            const breed = document.createElement('span');
            breed.className = 'friend-breed';
            breed.textContent = dog.breed || '';

            info.appendChild(name);
            info.appendChild(breed);

            link.appendChild(img);
            link.appendChild(info);
            li.appendChild(link);

            friendsContainer.appendChild(li);
        });
    } catch (error) {
        console.error('Failed to load friends:', error);
        friendsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load friends.</p>
            </div>
        `;
    }
}

/**
 * Load dog's posts into the profile Posts tab grid
 * Uses the dog ID stored in currentDog (set by initProfile)
 */
export async function loadProfilePosts() {
    const postsGrid = document.querySelector('#posts .posts-grid');
    if (!postsGrid || !currentDog) return;

    try {
        const result = await getDogPosts(currentDog.id);

        if (!result.posts || result.posts.length === 0) {
            const isOwner = currentDog && currentDog.isOwner;
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-camera"></i>
                    <p>${isOwner ? 'No posts yet. Share your first photo!' : 'No posts yet.'}</p>
                </div>
            `;
            return;
        }

        postsGrid.innerHTML = '';
        result.posts.forEach(post => {
            const img = document.createElement('img');
            img.src = post.imageUrl;
            img.alt = post.caption || 'Post image';
            img.loading = 'lazy';
            img.onerror = function() {
                const fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23cccccc" width="300" height="300"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                if (this.src !== fallback) {
                    this.src = fallback;
                }
            };

            const overlay = document.createElement('div');
            overlay.className = 'posts-grid-overlay';
            overlay.innerHTML = `
                <span><i class="fas fa-heart"></i> ${post.likeCount || 0}</span>
            `;

            // Wrap in a link to post detail
            const link = document.createElement('a');
            link.href = `/post/${post.id}`;
            link.setAttribute('data-link', '');
            link.className = 'posts-grid-item';

            link.appendChild(img);
            link.appendChild(overlay);
            postsGrid.appendChild(link);
        });
    } catch (error) {
        console.error('Failed to load profile posts:', error);
        postsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load posts.</p>
            </div>
        `;
    }
}

// Health record type icons and labels
const HEALTH_TYPE_CONFIG = {
    vet_visit: { icon: 'fa-stethoscope', label: 'Vet Visit', color: '#3b82f6' },
    vaccination: { icon: 'fa-syringe', label: 'Vaccination', color: '#10b981' },
    medication: { icon: 'fa-pills', label: 'Medication', color: '#f59e0b' },
    weight: { icon: 'fa-weight', label: 'Weight', color: '#EF4621' },
    note: { icon: 'fa-sticky-note', label: 'Note', color: '#6b7280' },
};

// Current filter state for health records
let healthFilterType = null;

/**
 * Load health records (owner only)
 * @param {string} dogId - Dog ID
 */
export async function loadHealthRecords(dogId) {
    const healthContainer = document.querySelector('#health');
    if (!healthContainer) return;

    const isOwner = currentDog && currentDog.isOwner;

    if (!isOwner) {
        healthContainer.innerHTML = `
            <div class="private-content">
                <i class="fas fa-lock"></i>
                <p>Health records are private and only visible to the owner.</p>
            </div>
        `;
        return;
    }

    // Render header with add button and filter tabs
    healthContainer.innerHTML = `
        <div class="health-header">
            <h2>Health Records</h2>
            <button class="btn-primary health-add-btn" id="add-health-record-btn">
                <i class="fas fa-plus"></i> Add Record
            </button>
        </div>
        <div class="health-filters" id="health-filters">
            <button class="health-filter-btn active" data-type="">All</button>
            <button class="health-filter-btn" data-type="vet_visit"><i class="fas fa-stethoscope"></i> Vet</button>
            <button class="health-filter-btn" data-type="vaccination"><i class="fas fa-syringe"></i> Vaccines</button>
            <button class="health-filter-btn" data-type="medication"><i class="fas fa-pills"></i> Meds</button>
            <button class="health-filter-btn" data-type="weight"><i class="fas fa-weight"></i> Weight</button>
            <button class="health-filter-btn" data-type="note"><i class="fas fa-sticky-note"></i> Notes</button>
        </div>
        <div class="health-timeline" id="health-timeline">
            <div class="health-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        </div>
    `;

    // Wire up add button
    const addBtn = document.getElementById('add-health-record-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openHealthRecordModal(currentDog.id, null, () => loadHealthTimeline(currentDog.id), healthFilterType);
        });
    }

    // Wire up filter buttons
    const filterBtns = healthContainer.querySelectorAll('.health-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            healthFilterType = btn.dataset.type || null;
            loadHealthTimeline(currentDog.id);
        });
    });

    // Load records
    await loadHealthTimeline(currentDog.id);
}

/**
 * Load and render health timeline records
 * @param {string} dogId - Dog ID
 */
async function loadHealthTimeline(dogId) {
    const timeline = document.getElementById('health-timeline');
    if (!timeline) return;

    timeline.innerHTML = '<div class="health-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const opts = { limit: 50 };
        if (healthFilterType) opts.type = healthFilterType;
        const data = await getHealthRecords(dogId, opts);

        if (!data.records || data.records.length === 0) {
            if (healthFilterType) {
                timeline.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heartbeat"></i>
                        <p>No records of this type yet.</p>
                    </div>
                `;
            } else {
                timeline.innerHTML = '';
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.innerHTML = '<i class="fas fa-heartbeat"></i>';

                const msg = document.createElement('p');
                msg.textContent = "Start tracking your dog's health!";
                empty.appendChild(msg);

                const addBtn = document.createElement('button');
                addBtn.className = 'btn-primary';
                addBtn.style.marginTop = '12px';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Add First Record';
                addBtn.addEventListener('click', () => {
                    openHealthRecordModal(dogId, null, () => loadHealthTimeline(dogId));
                });
                empty.appendChild(addBtn);
                timeline.appendChild(empty);
            }
            return;
        }

        timeline.innerHTML = '';
        data.records.forEach(record => {
            const config = HEALTH_TYPE_CONFIG[record.type] || HEALTH_TYPE_CONFIG.note;
            const dateParseable = typeof record.date === 'string' && record.date.length === 10
                ? record.date + 'T00:00:00'
                : record.date;
            const recordDate = new Date(dateParseable);
            const dateStr = recordDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const card = document.createElement('div');
            card.className = 'health-card';

            let valueHtml = '';
            if (record.type === 'weight' && record.value != null) {
                valueHtml = `<span class="health-value"><i class="fas fa-weight"></i> ${record.value} kg</span>`;
            }

            card.innerHTML = `
                <div class="health-card-icon" style="background-color: ${config.color}">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="health-card-body">
                    <div class="health-card-header">
                        <span class="health-card-type">${config.label}</span>
                        <span class="health-card-date">${dateStr}</span>
                    </div>
                    <p class="health-card-desc">${escapeHTML(record.description)}</p>
                    ${record.notes ? `<p class="health-card-notes">${escapeHTML(record.notes)}</p>` : ''}
                    ${valueHtml}
                </div>
                <div class="health-card-actions">
                    <button class="health-action-btn health-edit-btn" title="Edit" data-id="${record.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="health-action-btn health-delete-btn" title="Delete" data-id="${record.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Wire up edit
            card.querySelector('.health-edit-btn').addEventListener('click', () => {
                openHealthRecordModal(dogId, record, () => loadHealthTimeline(dogId));
            });

            // Wire up delete
            card.querySelector('.health-delete-btn').addEventListener('click', async () => {
                if (!confirm('Delete this health record?')) return;
                try {
                    await deleteHealthRecord(dogId, record.id);
                    showToast('Record deleted', 'success');
                    loadHealthTimeline(dogId);
                } catch (err) {
                    console.error('Delete health record failed:', err);
                    showToast('Failed to delete record', 'error');
                }
            });

            timeline.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load health records:', error);
        timeline.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load health records.</p>
            </div>
        `;
    }
}
