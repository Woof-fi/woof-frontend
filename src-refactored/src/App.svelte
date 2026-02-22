<script>
    import { refreshSession } from '../js/auth.js';
    import { healthCheck } from '../js/api.js';
    import { showToast } from '../js/utils.js';
    import Navigation from './components/Navigation.svelte';
    import Router from './router/Router.svelte';
    import AuthModal from './components/AuthModal.svelte';
    import CreatePostModal from './components/CreatePostModal.svelte';
    import CreateDogModal from './components/CreateDogModal.svelte';
    import EditDogModal from './components/EditDogModal.svelte';
    import HealthRecordModal from './components/HealthRecordModal.svelte';
    import Search from './components/Search.svelte';

    function openAuthModal() {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
    }

    function openCreatePostModal() {
        window.dispatchEvent(new CustomEvent('openCreatePostModal'));
    }

    $effect(() => {
        (async () => {
            await refreshSession();
            try {
                const healthy = await healthCheck();
                if (!healthy) showToast('Backend API is unavailable', 'error');
            } catch {
                // Ignore health check failures
            }
        })();

        window.WoofApp = {
            navigate: (path) => {
                history.pushState({}, '', path);
                window.dispatchEvent(new CustomEvent('routechange'));
            }
        };
    });
</script>

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
<div id="toast-container" class="toast-container"></div>
