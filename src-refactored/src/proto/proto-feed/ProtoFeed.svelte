<script>
    import ProtoFeedTabs from './ProtoFeedTabs.svelte';
    import ParkVisitCard from './ParkVisitCard.svelte';
    import NewDogCard from './NewDogCard.svelte';
    import PostCard from '../../components/PostCard.svelte';
    import {
        MOCK_POSTS, MOCK_PARK_VISITS, MOCK_NEW_DOGS,
        MOCK_DOGS, MOCK_FOLLOWED_DISTRICTS,
    } from '../mock-data.js';

    let activeTab = $state('following');

    function handleTabChange(tab) {
        activeTab = tab;
    }

    // --- Following tab data ---
    // Dogs the user follows
    const followedDogIds = new Set(MOCK_DOGS.filter(d => d.isFollowing).map(d => d.id));

    // Posts from followed dogs
    const followingPosts = MOCK_POSTS.filter(p => followedDogIds.has(p.dogId));

    // Visits at followed parks
    const followingVisits = MOCK_PARK_VISITS.filter(v => v.park.isFollowing);

    // New dogs in followed sub_districts only
    const followingNewDogs = MOCK_NEW_DOGS.filter(
        d => d.territoryType === 'sub_district' && MOCK_FOLLOWED_DISTRICTS.includes(d.territoryName)
    );

    /**
     * Interleave: visit, post, newdog, post, visit, post, newdog, ...
     * Pulls from each source in round-robin until all are exhausted.
     */
    function interleave(posts, visits, newDogs) {
        const items = [];
        let pi = 0, vi = 0, ni = 0;
        while (pi < posts.length || vi < visits.length || ni < newDogs.length) {
            if (vi < visits.length) items.push({ type: 'visit', data: visits[vi++] });
            if (pi < posts.length) items.push({ type: 'post', data: posts[pi++] });
            if (ni < newDogs.length) items.push({ type: 'newdog', data: newDogs[ni++] });
            if (pi < posts.length) items.push({ type: 'post', data: posts[pi++] });
        }
        return items;
    }

    const followingItems = interleave(followingPosts, followingVisits, followingNewDogs);
</script>

<ProtoFeedTabs {activeTab} ontabchange={handleTabChange} />

<div class="feed-container">
    {#if activeTab === 'following'}
        {#each followingItems as item (item.data.id)}
            {#if item.type === 'visit'}
                <ParkVisitCard visit={item.data} />
            {:else if item.type === 'newdog'}
                <NewDogCard dog={item.data} />
            {:else}
                <PostCard
                    id={item.data.id}
                    profilePic={item.data.profilePic}
                    username={item.data.username}
                    caption={item.data.caption}
                    imageUrl={item.data.imageUrl}
                    dogSlug={item.data.dogSlug}
                    dogId={item.data.dogId}
                    isOwnPost={false}
                    likeCount={item.data.likeCount}
                    commentCount={item.data.commentCount}
                    likedByUser={item.data.likedByUser}
                    createdAt={item.data.createdAt}
                    updatedAt={item.data.updatedAt}
                    breedName={item.data.breedName}
                    breedSlug={item.data.breedSlug}
                    territoryName={item.data.territoryName}
                    territoryType={item.data.territoryType}
                    territoryParentName={item.data.territoryParentName}
                    territoryGrandparentName={item.data.territoryGrandparentName}
                    territoryUrlPath={item.data.territoryUrlPath}
                />
            {/if}
        {/each}

    {:else}
        {#each MOCK_POSTS as post (post.id)}
            <PostCard
                id={post.id}
                profilePic={post.profilePic}
                username={post.username}
                caption={post.caption}
                imageUrl={post.imageUrl}
                dogSlug={post.dogSlug}
                dogId={post.dogId}
                isOwnPost={false}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                likedByUser={post.likedByUser}
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                breedName={post.breedName}
                breedSlug={post.breedSlug}
                territoryName={post.territoryName}
                territoryType={post.territoryType}
                territoryParentName={post.territoryParentName}
                territoryGrandparentName={post.territoryGrandparentName}
                territoryUrlPath={post.territoryUrlPath}
            />
        {/each}
    {/if}
</div>

<style>
.feed-container {
    max-width: 500px;
    margin: 0 auto;
    padding-top: var(--woof-space-4);
}
</style>
