<script>
    import { getPostLikers } from '../../js/api.js';
    import { modals, closeLikerListModal } from '../../js/modal-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import DogListModal from './DogListModal.svelte';

    async function fetchDogs() {
        const { postId } = modals.likerListData;
        const data = await getPostLikers(postId);
        return data.likers || [];
    }
</script>

<DogListModal
    isOpen={modals.likerListModalOpen}
    title={t('post.likes')}
    ariaId="liker-list-title"
    emptyIcon="far fa-heart"
    emptyText={t('post.noLikesYet')}
    {fetchDogs}
    onclose={closeLikerListModal}
/>
