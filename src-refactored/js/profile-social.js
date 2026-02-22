/**
 * Profile Social
 * Friends tab: mutual-follow list display.
 */

import { getFollowers, getFollowing } from './api.js';
import { escapeHTML } from './utils.js';

/**
 * Load dog friends (mutual follows) into the Friends tab
 * @param {string} dogId - Dog ID
 */
export async function loadFriends(dogId) {
    const friendsContainer = document.querySelector('#friends .friend-list');
    if (!friendsContainer) return;

    friendsContainer.innerHTML = `
        <div class="friends-loading">
            <i class="fas fa-spinner fa-spin"></i> Loading...
        </div>
    `;

    try {
        const [followers, following] = await Promise.all([
            getFollowers(dogId),
            getFollowing(dogId)
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
