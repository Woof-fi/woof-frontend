<script>
    import { handleModalPopstate } from '../../js/modal-history.js';
    import HomeView from '../views/HomeView.svelte';
    import ProfileView from '../views/ProfileView.svelte';
    import PostDetailView from '../views/PostDetailView.svelte';
    import MessagesView from '../views/MessagesView.svelte';
    import AdminView from '../views/AdminView.svelte';
    import NotificationsView from '../views/NotificationsView.svelte';

    let { onopenAuthModal = null } = $props();

    let currentPath = $state(window.location.pathname);
    let navigating = $state(false);

    function pathToRegex(path) {
        const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = escaped.replace(/:(\w+)/g, '([^/]+)');
        return new RegExp(`^${pattern}$`);
    }

    function extractParamNames(path) {
        return Array.from(path.matchAll(/:(\w+)/g), m => m[1]);
    }

    const routes = [
        { path: '/',               component: HomeView,           paramNames: [] },
        { path: '/dog/:slug',      component: ProfileView,        paramNames: ['slug'] },
        { path: '/post/:id',       component: PostDetailView,     paramNames: ['id'] },
        { path: '/messages',       component: MessagesView,       paramNames: [] },
        { path: '/messages/:id',   component: MessagesView,       paramNames: ['id'] },
        { path: '/admin',          component: AdminView,          paramNames: [] },
        { path: '/notifications',  component: NotificationsView,  paramNames: [] },
    ];

    const compiledRoutes = routes.map(r => ({
        ...r,
        pattern: pathToRegex(r.path),
        paramNames: extractParamNames(r.path),
    }));

    let matched = $derived.by(() => {
        for (const route of compiledRoutes) {
            const m = currentPath.match(route.pattern);
            if (m) {
                const params = {};
                route.paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
                return { component: route.component, params };
            }
        }
        return { component: HomeView, params: {} };
    });

    $effect(() => {
        currentPath; // track
        window.scrollTo(0, 0);
    });

    function handlePopstate(e) {
        const consumed = handleModalPopstate(e);
        if (!consumed) currentPath = window.location.pathname;
    }

    function handleLinkClick(e) {
        const a = e.target.closest('a[data-link]');
        if (!a) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        navigating = true;
        history.pushState({}, '', href);
        currentPath = new URL(href, window.location.origin).pathname;
        window.dispatchEvent(new CustomEvent('routechange'));
    }

    $effect(() => {
        matched; // track
        const t = setTimeout(() => { navigating = false; }, 150);
        return () => clearTimeout(t);
    });

    $effect(() => {
        window.addEventListener('popstate', handlePopstate);
        document.addEventListener('click', handleLinkClick);

        function handleRouteChange() {
            currentPath = window.location.pathname;
        }
        window.addEventListener('routechange', handleRouteChange);

        return () => {
            window.removeEventListener('popstate', handlePopstate);
            document.removeEventListener('click', handleLinkClick);
            window.removeEventListener('routechange', handleRouteChange);
        };
    });
</script>

<div class="route-progress" class:active={navigating}></div>
<div class="content">
    {#if matched.component === HomeView}
        <HomeView onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === ProfileView}
        <ProfileView params={matched.params} onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === PostDetailView}
        <PostDetailView params={matched.params} onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === MessagesView}
        <MessagesView params={matched.params} onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === AdminView}
        <AdminView />
    {:else if matched.component === NotificationsView}
        <NotificationsView onopenAuthModal={onopenAuthModal} />
    {/if}
</div>
