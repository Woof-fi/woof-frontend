<script>
    import { getPost } from '../../js/api.js';
    import PostCard from '../components/PostCard.svelte';

    let { params = {}, onopenAuthModal = null } = $props();
    let post = $state(null);
    let loading = $state(true);
    let error = $state(null);

    $effect(() => {
        const id = params.id;
        if (!id) { window.location.href = '/'; return; }

        loading = true;
        error = null;
        post = null;

        (async () => {
            try {
                const data = await getPost(id);
                post = data;
            } catch (e) {
                error = e;
            } finally {
                loading = false;
            }
        })();
    });
</script>

<main class="post-detail-page">
    <div class="post-detail-header">
        <button class="back-btn" aria-label="Go back" onclick={() => window.history.back()}>
            <i class="fas fa-arrow-left"></i>
        </button>
        <h2>Post</h2>
    </div>
    <div class="post-detail-container" id="post-detail-container">
        {#if loading}
            <div class="post-detail-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        {:else if error}
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load post.</p>
            </div>
        {:else if post}
            <PostCard
                id={post.id}
                profilePic={post.dogPhoto || '/assets/images/dog_profile_pic.jpg'}
                username={post.dogName || 'Unknown Dog'}
                imageUrl={post.imageUrl}
                caption={post.caption || ''}
                location={post.dogLocation || ''}
                dogSlug={post.dogSlug || ''}
                likeCount={post.likeCount || 0}
                commentCount={post.commentCount || 0}
                likedByUser={post.likedByUser || false}
                createdAt={post.createdAt}
                onopenAuthModal={onopenAuthModal}
            />
        {/if}
    </div>
</main>
