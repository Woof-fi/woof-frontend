<script>
    import { initProfile, initProfileTabs, loadProfilePosts, loadFollowingCount, getCurrentDog } from '../../js/profile.js';
    import { loadFriends } from '../../js/profile-social.js';
    import { loadHealthRecords } from '../../js/profile-health.js';

    let { params = {}, onopenAuthModal = null } = $props();
    let slug = $derived(params.slug || 'nelli-1');

    $effect(() => {
        const currentSlug = slug;

        (async () => {
            await initProfile(currentSlug);
            initProfileTabs();
            loadProfilePosts();
            loadFollowingCount();

            // getCurrentDog() is populated by initProfile above
            const dog = getCurrentDog();
            if (dog) {
                loadFriends(dog.id);
                loadHealthRecords(dog);
            }
        })();
    });
</script>

<div class="profile-page">
    <div class="profile-hero" id="profile-hero"></div>
    <div class="profile-sheet">
        <div class="profile-container" data-dog-slug={slug}></div>
        <div class="profile-tabs" role="tablist">
            <button class="tab-link active" data-tab="posts" role="tab" aria-selected="true">
                <i class="fas fa-th"></i> Posts
            </button>
            <button class="tab-link" data-tab="friends" role="tab" aria-selected="false">
                <i class="fas fa-user-friends"></i> Friends
            </button>
            <button class="tab-link" data-tab="health" role="tab" aria-selected="false">
                <i class="fas fa-heartbeat"></i> Health
            </button>
        </div>
        <div class="tab-content active" id="posts" role="tabpanel" aria-hidden="false">
            <div class="posts-grid posts-grid-2col"></div>
        </div>
        <div class="tab-content" id="friends" role="tabpanel" aria-hidden="true">
            <div class="friend-list"></div>
        </div>
        <div class="tab-content" id="health" role="tabpanel" aria-hidden="true">
        </div>
    </div>
    <div class="profile-follow-sticky" id="profile-follow-sticky"></div>
</div>
