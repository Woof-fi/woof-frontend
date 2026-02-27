<script>
    import { refreshSession } from '../js/auth.js';
    import { healthCheck, syncUser } from '../js/api.js';
    import { showToast } from '../js/utils.js';
    import { openAuthModal, openCreatePostModal, modals } from '../js/modal-store.svelte.js';
    import { setAuthUser } from '../js/svelte-store.svelte.js';
    import { isAuthenticated } from '../js/auth.js';
    import Toast from './components/Toast.svelte';
    import Navigation from './components/Navigation.svelte';
    import Router from './router/Router.svelte';
    import SiteGate from './components/SiteGate.svelte';
    import AuthModal from './components/AuthModal.svelte';
    import CreatePostModal from './components/CreatePostModal.svelte';
    import CreateDogModal from './components/CreateDogModal.svelte';
    import EditDogModal from './components/EditDogModal.svelte';
    import HealthRecordModal from './components/HealthRecordModal.svelte';
    import Search from './components/Search.svelte';
    import PostOptionsSheet from './components/PostOptionsSheet.svelte';
    import CommentOptionsSheet from './components/CommentOptionsSheet.svelte';

    $effect(() => {
        (async () => {
            await refreshSession();
            // If user already has a valid session, ensure they exist in the local DB
            if (isAuthenticated()) {
                const user = await syncUser();
                setAuthUser({ authenticated: true, role: user?.role ?? 'user' });
            } else {
                setAuthUser(null);
            }
            try {
                const healthy = await healthCheck();
                if (!healthy) showToast('Backend API is unavailable', 'error');
            } catch {
                // Ignore health check failures
            }
        })();
    });
</script>

<SiteGate>
    {#snippet children()}
        <div class="app-container">
            <Navigation
                onopenAuthModal={openAuthModal}
                onopenCreatePostModal={openCreatePostModal}
            />
            <div class="main-container">
                <Router onopenAuthModal={openAuthModal} />
            </div>
        </div>

        <AuthModal />
        <CreatePostModal />
        <CreateDogModal />
        <EditDogModal />
        <HealthRecordModal />
        <Search />
        {#if modals.postOptionsSheetOpen}
            <PostOptionsSheet />
        {/if}
        {#if modals.commentOptionsSheetOpen}
            <CommentOptionsSheet />
        {/if}
        <Toast />
    {/snippet}
</SiteGate>
