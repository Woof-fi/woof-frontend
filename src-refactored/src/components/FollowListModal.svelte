<script>
    import { getFollowers, getFollowing } from '../../js/api.js';
    import { modals, closeFollowListModal } from '../../js/modal-store.svelte.js';
    import { t } from '../../js/i18n-store.svelte.js';
    import DogListModal from './DogListModal.svelte';

    let title = $derived(
        modals.followListData?.type === 'followers' ? t('profile.followers') : t('profile.following')
    );

    let emptyText = $derived(
        modals.followListData?.type === 'followers' ? t('profile.noFollowers') : t('profile.noFollowing')
    );

    async function fetchDogs() {
        const { dogId, type } = modals.followListData;
        return type === 'followers'
            ? await getFollowers(dogId)
            : await getFollowing(dogId);
    }
</script>

<DogListModal
    isOpen={modals.followListModalOpen}
    {title}
    ariaId="follow-list-title"
    emptyIcon="fas fa-user-group"
    {emptyText}
    {fetchDogs}
    onclose={closeFollowListModal}
/>
