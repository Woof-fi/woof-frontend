<script>
    import Feed from '../components/Feed.svelte';

    let { onopenAuthModal = null } = $props();
    let activeTab = $state('public');
</script>

<main>
    <div class="feed-tabs" role="tablist">
        <button
            class="feed-tab"
            class:active={activeTab === 'public'}
            data-feed-type="public"
            role="tab"
            aria-selected={activeTab === 'public'}
            onclick={() => activeTab = 'public'}
        >For You</button>
        <button
            class="feed-tab"
            class:active={activeTab === 'following'}
            data-feed-type="following"
            role="tab"
            aria-selected={activeTab === 'following'}
            onclick={() => activeTab = 'following'}
        >Following</button>
    </div>
    <section class="feed">
        <div id="feed-container" class="feed-container" role="feed" aria-label="Dog posts feed">
            <Feed type={activeTab} onopenAuthModal={onopenAuthModal} />
        </div>
    </section>
</main>
