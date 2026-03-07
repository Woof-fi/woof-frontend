<script>
    import { getPost } from '../../js/api.js';
    import PostCard from '../components/PostCard.svelte';
    import { t } from '../../js/i18n-store.svelte.js';

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
    <div class="post-detail-nav">
        <button class="back-btn" aria-label={t('postDetail.goBack')} onclick={() => window.history.back()}>
            <i class="fas fa-arrow-left"></i>
            {t('postDetail.back')}
        </button>
    </div>
    <div class="post-detail-container" id="post-detail-container">
        {#if loading}
            <div class="post-detail-loading"><i class="fas fa-spinner fa-spin"></i> {t('postDetail.loading')}</div>
        {:else if error}
            <div class="woof-empty-state">
                <div class="woof-empty-state-icon woof-empty-state-icon--error">
                    <i class="fas fa-circle-exclamation"></i>
                </div>
                <p>{t('postDetail.failedLoad')}</p>
            </div>
        {:else if post}
            <PostCard
                id={post.id}
                profilePic={post.dogPhoto || '/images/dog_profile_pic.jpg'}
                username={post.dogName || t('feed.unknownDog')}
                imageUrl={post.imageUrl}
                imageUrls={post.imageUrls || []}
                caption={post.caption || ''}
                dogSlug={post.dogSlug || ''}
                dogId={post.dogId || ''}
                likeCount={post.likeCount || 0}
                commentCount={post.commentCount || 0}
                likedByUser={post.likedByUser || false}
                createdAt={post.createdAt}
                updatedAt={post.updatedAt || null}
                breedName={post.breedName || ''}
                breedSlug={post.breedSlug || ''}
                territoryName={post.territoryName || ''}
                territoryType={post.territoryType || ''}
                territoryParentName={post.territoryParentName || ''}
                territoryGrandparentName={post.territoryGrandparentName || ''}
                territoryUrlPath={post.territoryUrlPath || ''}
                onopenAuthModal={onopenAuthModal}
            />
        {/if}
    </div>
</main>

<style>
.post-detail-page {
    max-width: 600px;
    margin: 0 auto;
}

.post-detail-nav {
    padding: var(--woof-space-3) var(--woof-space-4) var(--woof-space-2);
}

.post-detail-container {
    padding: 0;
}

.post-detail-loading {
    text-align: center;
    padding: 48px;
    color: var(--woof-color-neutral-500);
}
</style>
