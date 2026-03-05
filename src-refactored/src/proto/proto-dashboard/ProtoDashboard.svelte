<script>
    import PostCard from '../../components/PostCard.svelte';
    import { MOCK_DOGS, MOCK_PARKS, MOCK_POSTS, MOCK_PARK_VISITS, MOCK_TERRITORY_ACTIVITY } from '../mock-data.js';
    import UpcomingVisitsSection from './UpcomingVisitsSection.svelte';
    import TerritoryActivitySection from './TerritoryActivitySection.svelte';
    import NearbyParksSection from './NearbyParksSection.svelte';

    const dog = MOCK_DOGS[0];
    const posts = MOCK_POSTS.slice(0, 3);

    let greeting = $derived.by(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour <= 11) return 'morning';
        if (hour >= 12 && hour <= 16) return 'afternoon';
        if (hour >= 17 && hour <= 21) return 'evening';
        return 'night';
    });
</script>

<div class="dashboard">
    <!-- Greeting header -->
    <div class="greeting">
        <img class="greeting-avatar" src={dog.profilePhoto} alt={dog.name} />
        <div class="greeting-text">
            <h1 class="greeting-title">Good {greeting}, {dog.name}!</h1>
            <p class="greeting-subtitle">Here's what's happening in your area</p>
        </div>
    </div>

    <!-- Dashboard sections -->
    <div class="sections">
        <UpcomingVisitsSection visits={MOCK_PARK_VISITS} />
        <TerritoryActivitySection territories={MOCK_TERRITORY_ACTIVITY} />
        <NearbyParksSection parks={MOCK_PARKS} />
    </div>

    <!-- Recent Posts -->
    <div class="recent-posts">
        <h2 class="section-header">Recent Posts</h2>

        <div class="posts-feed">
            {#each posts as post (post.id)}
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
        </div>
    </div>
</div>

<style>
    .dashboard {
        width: 100%;
        max-width: 100%;
        padding: var(--woof-space-4);
    }

    /* Greeting */
    .greeting {
        display: flex;
        align-items: center;
        gap: var(--woof-space-4);
        padding: var(--woof-space-4) 0;
    }

    .greeting-avatar {
        width: 60px;
        height: 60px;
        border-radius: var(--woof-radius-full);
        object-fit: cover;
        flex-shrink: 0;
        border: 2px solid var(--woof-color-neutral-200);
    }

    .greeting-text {
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-1);
    }

    .greeting-title {
        font-size: var(--woof-text-title-2);
        font-weight: var(--woof-font-weight-bold);
        color: var(--woof-color-neutral-900);
        margin: 0;
        line-height: var(--woof-lh-title-2);
    }

    .greeting-subtitle {
        font-size: var(--woof-text-callout);
        color: var(--woof-color-neutral-500);
        margin: 0;
        line-height: 1.4;
    }

    /* Dashboard sections container */
    .sections {
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-6);
    }

    /* Recent posts */
    .recent-posts {
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
    }

    .section-header {
        font-size: var(--woof-text-headline);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-900);
        margin: var(--woof-space-6) 0 var(--woof-space-3) 0;
    }

    .posts-feed {
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-4);
    }
</style>
