<script>
    import { handleModalPopstate } from '../../js/modal-history.js';
    import HomeView from '../views/HomeView.svelte';
    import ProfileView from '../views/ProfileView.svelte';
    import PostDetailView from '../views/PostDetailView.svelte';
    import MessagesView from '../views/MessagesView.svelte';
    import AdminView from '../views/AdminView.svelte';
    import NotificationsView from '../views/NotificationsView.svelte';
    import PrivacyView from '../views/PrivacyView.svelte';
    import TermsView from '../views/TermsView.svelte';
    import BreedView from '../views/BreedView.svelte';
    import BreedDirectoryView from '../views/BreedDirectoryView.svelte';
    import TerritoryDirectoryView from '../views/TerritoryDirectoryView.svelte';
    import TerritoryView from '../views/TerritoryView.svelte';
    import BookmarksView from '../views/BookmarksView.svelte';
    import DogParkView from '../views/DogParkView.svelte';
    import ProtoView from '../proto/ProtoView.svelte';

    let { onopenAuthModal = null } = $props();

    let currentPath = $state(window.location.pathname);
    let navProgress = $state('idle'); // 'idle' | 'loading' | 'done'
    let isBackNavigation = false;

    // Scroll position map: path → scrollY (stored in sessionStorage for tab persistence)
    const SCROLL_KEY = 'woof_scroll_positions';

    function saveScrollPosition(path) {
        try {
            const positions = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
            positions[path] = window.scrollY;
            sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
        } catch { /* ignore storage errors */ }
    }

    function restoreScrollPosition(path) {
        try {
            const positions = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
            const y = positions[path];
            if (y !== undefined && y > 0) {
                // Poll until the document is tall enough to scroll to, or give up after 2s
                let attempts = 0;
                const maxAttempts = 20;
                function tryRestore() {
                    if (document.documentElement.scrollHeight > y + window.innerHeight || attempts >= maxAttempts) {
                        window.scrollTo(0, y);
                    } else {
                        attempts++;
                        setTimeout(tryRestore, 100);
                    }
                }
                // Start after a frame to let Svelte begin rendering
                requestAnimationFrame(tryRestore);
            }
        } catch { /* ignore storage errors */ }
    }

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
        { path: '/breeds',         component: BreedDirectoryView, paramNames: [] },
        { path: '/breed/:slug',    component: BreedView,          paramNames: ['slug'] },
        { path: '/territories',    component: TerritoryDirectoryView, paramNames: [] },
        { path: '/territory/:a/:b/:c', component: TerritoryView,  paramNames: ['a', 'b', 'c'] },
        { path: '/territory/:a/:b',    component: TerritoryView,  paramNames: ['a', 'b'] },
        { path: '/territory/:a',       component: TerritoryView,  paramNames: ['a'] },
        { path: '/dog-park/:slug',  component: DogParkView,        paramNames: ['slug'] },
        { path: '/bookmarks',      component: BookmarksView,      paramNames: [] },
        { path: '/dog/:slug',      component: ProfileView,        paramNames: ['slug'] },
        { path: '/post/:id',       component: PostDetailView,     paramNames: ['id'] },
        { path: '/messages',       component: MessagesView,       paramNames: [] },
        { path: '/messages/:id',   component: MessagesView,       paramNames: ['id'] },
        { path: '/admin/:section',  component: AdminView,          paramNames: ['section'] },
        { path: '/admin',          component: AdminView,          paramNames: [] },
        { path: '/notifications',  component: NotificationsView,  paramNames: [] },
        { path: '/privacy',        component: PrivacyView,        paramNames: [] },
        { path: '/terms',          component: TermsView,          paramNames: [] },
        { path: '/proto/:name',    component: ProtoView,          paramNames: ['name'] },
        { path: '/proto',          component: ProtoView,          paramNames: [] },
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
        if (isBackNavigation) {
            restoreScrollPosition(currentPath);
            isBackNavigation = false;
        } else {
            window.scrollTo(0, 0);
        }
    });

    function handlePopstate(e) {
        const consumed = handleModalPopstate(e);
        if (!consumed) {
            isBackNavigation = true;
            currentPath = window.location.pathname;
        }
    }

    function handleLinkClick(e) {
        const a = e.target.closest('a[data-link]');
        if (!a) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        const newPath = new URL(href, window.location.origin).pathname;

        // Save scroll position before navigating away
        saveScrollPosition(currentPath);

        navProgress = 'loading';
        history.pushState({}, '', href);
        currentPath = newPath;
        window.dispatchEvent(new CustomEvent('routechange'));
    }

    // When route matches, animate progress bar: loading → done → idle
    $effect(() => {
        matched; // track
        if (navProgress !== 'loading') return;
        // First go to 100% (done state)
        navProgress = 'done';
        // Then reset to idle after the completion animation finishes
        const t = setTimeout(() => { navProgress = 'idle'; }, 350);
        return () => clearTimeout(t);
    });

    $effect(() => {
        window.addEventListener('popstate', handlePopstate);
        document.addEventListener('click', handleLinkClick);

        function handleRouteChange() {
            const newPath = window.location.pathname;
            if (newPath !== currentPath) {
                saveScrollPosition(currentPath);
            }
            currentPath = newPath;
        }
        window.addEventListener('routechange', handleRouteChange);

        return () => {
            window.removeEventListener('popstate', handlePopstate);
            document.removeEventListener('click', handleLinkClick);
            window.removeEventListener('routechange', handleRouteChange);
        };
    });
</script>

<div class="route-progress" class:loading={navProgress === 'loading'} class:done={navProgress === 'done'}></div>
<div class="content">
    {#if matched.component === HomeView}
        <HomeView onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === BreedDirectoryView}
        <BreedDirectoryView />
    {:else if matched.component === BreedView}
        <BreedView params={matched.params} />
    {:else if matched.component === TerritoryDirectoryView}
        <TerritoryDirectoryView />
    {:else if matched.component === TerritoryView}
        <TerritoryView params={matched.params} />
    {:else if matched.component === DogParkView}
        <DogParkView params={matched.params} />
    {:else if matched.component === BookmarksView}
        <BookmarksView onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === ProfileView}
        <ProfileView params={matched.params} onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === PostDetailView}
        <PostDetailView params={matched.params} onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === MessagesView}
        <MessagesView params={matched.params} onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === AdminView}
        <AdminView params={matched.params} />
    {:else if matched.component === NotificationsView}
        <NotificationsView onopenAuthModal={onopenAuthModal} />
    {:else if matched.component === PrivacyView}
        <PrivacyView />
    {:else if matched.component === TermsView}
        <TermsView />
    {:else if matched.component === ProtoView}
        <ProtoView params={matched.params} />
    {/if}
</div>
