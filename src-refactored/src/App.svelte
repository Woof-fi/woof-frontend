<script>
    import { refreshSession, setOnSessionCleared } from '../js/auth.js';
    import { healthCheck, syncUser } from '../js/api.js';
    import { showToast } from '../js/utils.js';
    import { t } from '../js/i18n-store.svelte.js';
    import { openAuthModal, modals } from '../js/modal-store.svelte.js';
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
    import EditPostModal from './components/EditPostModal.svelte';
    import EditCommentModal from './components/EditCommentModal.svelte';
    import HealthRecordModal from './components/HealthRecordModal.svelte';
    import Search from './components/Search.svelte';
    import PostOptionsSheet from './components/PostOptionsSheet.svelte';
    import CommentOptionsSheet from './components/CommentOptionsSheet.svelte';
    import CheckinOptionsSheet from './components/CheckinOptionsSheet.svelte';
    import FollowListModal from './components/FollowListModal.svelte';
    import LikerListModal from './components/LikerListModal.svelte';
    import CreateActionSheet from './components/CreateActionSheet.svelte';

    // When the API layer detects an expired session that can't be refreshed,
    // clear the Svelte store so the UI updates reactively (e.g. nav shows login).
    setOnSessionCleared(() => setAuthUser(null));

    // Cognito ID tokens expire after 1 hour.
    // Refresh proactively every 50 minutes so the token never goes stale.
    const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

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
                if (!healthy) showToast(t('common.apiUnavailable'), 'error');
            } catch {
                // Ignore health check failures
            }
        })();

        // Proactive token refresh: keeps the token fresh while the app is open
        const refreshInterval = setInterval(async () => {
            if (isAuthenticated()) {
                await refreshSession();
            }
        }, TOKEN_REFRESH_INTERVAL);

        // Refresh when user returns to the tab after being away (e.g. phone sleep)
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible' && isAuthenticated()) {
                refreshSession();
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    });
</script>

<SiteGate>
    {#snippet children()}
        <div class="app-container">
            <Navigation
                onopenAuthModal={openAuthModal}
            />
            <div class="main-container">
                <Router onopenAuthModal={openAuthModal} />
            </div>
        </div>

        <AuthModal />
        <CreatePostModal />
        <CreateDogModal />
        <EditDogModal />
        <EditPostModal />
        <EditCommentModal />
        <FollowListModal />
        <LikerListModal />
        <HealthRecordModal />
        <Search />
        {#if modals.postOptionsSheetOpen}
            <PostOptionsSheet />
        {/if}
        {#if modals.commentOptionsSheetOpen}
            <CommentOptionsSheet />
        {/if}
        {#if modals.checkinOptionsSheetOpen}
            <CheckinOptionsSheet />
        {/if}
        <CreateActionSheet />
        <Toast />
    {/snippet}
</SiteGate>
