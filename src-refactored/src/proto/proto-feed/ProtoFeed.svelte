<script>
    import ProtoFeedTabs from './ProtoFeedTabs.svelte';
    import ParkVisitCard from './ParkVisitCard.svelte';
    import NewDogCard from './NewDogCard.svelte';
    import PostCard from '../../components/PostCard.svelte';
    import { MOCK_POSTS, MOCK_PARK_VISITS, MOCK_NEW_DOGS } from '../mock-data.js';

    let activeTab = $state('foryou');

    function handleTabChange(tab) {
        activeTab = tab;
    }

    /**
     * "For You" interleaves visits, posts, and new dogs:
     *   visit[0], post[0], newdog[0], post[1], visit[1], post[2], newdog[1], post[3]
     */
    const forYouItems = [
        { type: 'visit', data: MOCK_PARK_VISITS[0] },
        { type: 'post', data: MOCK_POSTS[0] },
        { type: 'newdog', data: MOCK_NEW_DOGS[0] },
        { type: 'post', data: MOCK_POSTS[1] },
        { type: 'visit', data: MOCK_PARK_VISITS[1] },
        { type: 'post', data: MOCK_POSTS[2] },
        { type: 'newdog', data: MOCK_NEW_DOGS[1] },
        { type: 'post', data: MOCK_POSTS[3] },
    ];

    /** "Following" — subset of posts from followed dogs */
    const followingPosts = [MOCK_POSTS[0], MOCK_POSTS[1], MOCK_POSTS[4]];

    /** "General" — all posts */
    const generalPosts = MOCK_POSTS;
</script>

<ProtoFeedTabs {activeTab} ontabchange={handleTabChange} />

<div class="feed-container">
    {#if activeTab === 'foryou'}
        {#each forYouItems as item (item.data.id)}
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

    {:else if activeTab === 'following'}
        {#each followingPosts as post (post.id)}
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

    {:else}
        {#each generalPosts as post (post.id)}
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
