/**
 * Modal Store
 * Svelte 5 $state store for all modal/panel visibility and data.
 * Replaces window.dispatchEvent custom events for modal communication.
 *
 * Note: exported $state cannot be reassigned — use a single reactive object
 * whose properties are mutated, per Svelte 5 module export rules.
 */

export let modals = $state({
    authModalOpen: false,
    createPostModalOpen: false,
    createDogModalOpen: false,
    editDogModalOpen: false,
    editDogData: null,              // dog object
    editPostModalOpen: false,
    editPostData: null,             // { id, caption }
    healthRecordModalOpen: false,
    healthRecordData: null,         // { dogId, record }
    searchPanelOpen: false,
    postOptionsSheetOpen: false,
    postOptionsSheetData: null,     // { postId, dogId, dogSlug, isOwnPost, caption }
    commentOptionsSheetOpen: false,
    commentOptionsSheetData: null,  // { commentId, isOwnComment, content, onDeleted, onUpdated }
    editCommentModalOpen: false,
    editCommentData: null,          // { commentId, content, onUpdated }
    followListModalOpen: false,
    followListData: null,           // { dogId, type: 'followers' | 'following' }
    likerListModalOpen: false,
    likerListData: null,            // { postId }
});

export function openAuthModal() { modals.authModalOpen = true; }
export function closeAuthModal() { modals.authModalOpen = false; }
export function openCreatePostModal() { modals.createPostModalOpen = true; }
export function closeCreatePostModal() { modals.createPostModalOpen = false; }
export function openCreateDogModal() { modals.createDogModalOpen = true; }
export function closeCreateDogModal() { modals.createDogModalOpen = false; }
export function openEditDogModal(dog) { modals.editDogData = dog; modals.editDogModalOpen = true; }
export function closeEditDogModal() { modals.editDogModalOpen = false; modals.editDogData = null; }
export function openEditPostModal(post) { modals.editPostData = post; modals.editPostModalOpen = true; }
export function closeEditPostModal() { modals.editPostModalOpen = false; modals.editPostData = null; }
export function openHealthRecordModal(dogId, record) {
    modals.healthRecordData = { dogId, record };
    modals.healthRecordModalOpen = true;
}
export function closeHealthRecordModal() { modals.healthRecordModalOpen = false; modals.healthRecordData = null; }
export function openSearchPanel() { modals.searchPanelOpen = true; }
export function closeSearchPanel() { modals.searchPanelOpen = false; }
export function openPostOptionsSheet(data) { modals.postOptionsSheetData = data; modals.postOptionsSheetOpen = true; }
export function closePostOptionsSheet() { modals.postOptionsSheetOpen = false; modals.postOptionsSheetData = null; }
export function openCommentOptionsSheet(data) { modals.commentOptionsSheetData = data; modals.commentOptionsSheetOpen = true; }
export function closeCommentOptionsSheet() { modals.commentOptionsSheetOpen = false; modals.commentOptionsSheetData = null; }
export function openEditCommentModal(data) { modals.editCommentData = data; modals.editCommentModalOpen = true; }
export function closeEditCommentModal() { modals.editCommentModalOpen = false; modals.editCommentData = null; }
export function openFollowListModal(dogId, type) { modals.followListData = { dogId, type }; modals.followListModalOpen = true; }
export function closeFollowListModal() { modals.followListModalOpen = false; modals.followListData = null; }
export function openLikerListModal(postId) { modals.likerListData = { postId }; modals.likerListModalOpen = true; }
export function closeLikerListModal() { modals.likerListModalOpen = false; modals.likerListData = null; }
export function closeAllModals() {
    modals.authModalOpen = false;
    modals.createPostModalOpen = false;
    modals.createDogModalOpen = false;
    modals.editDogModalOpen = false;
    modals.editDogData = null;
    modals.editPostModalOpen = false;
    modals.editPostData = null;
    modals.healthRecordModalOpen = false;
    modals.healthRecordData = null;
    modals.searchPanelOpen = false;
    modals.postOptionsSheetOpen = false;
    modals.postOptionsSheetData = null;
    modals.commentOptionsSheetOpen = false;
    modals.commentOptionsSheetData = null;
    modals.editCommentModalOpen = false;
    modals.editCommentData = null;
    modals.followListModalOpen = false;
    modals.followListData = null;
    modals.likerListModalOpen = false;
    modals.likerListData = null;
}
