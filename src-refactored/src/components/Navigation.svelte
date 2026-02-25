<script>
    import { getMyDogs, getUnreadCount, getNotifUnreadCount } from '../../js/api.js';
    import { isAuthenticated, logout } from '../../js/auth.js';
    import { openCreateDogModal, openSearchPanel } from '../../js/modal-store.svelte.js';
    import { store, setAuthUser, setFeedTab, setNotifUnreadCount } from '../../js/svelte-store.svelte.js';

    let { onopenAuthModal = null, onopenCreatePostModal = null } = $props();

    let dogs = $state([]);
    let unreadCount = $state(0);
    let activePath = $state(window.location.pathname);
    let myDogsLoaded = $state(false);
    let drawerOpen = $state(false);
    let authed = $derived(store.authUser !== null);

    function getSlug(dog) {
        return dog.slug ?? `${dog.name.toLowerCase()}-${dog.displayId}`;
    }

    function toggleDrawer() { drawerOpen = !drawerOpen; }
    function closeDrawer() { drawerOpen = false; }

    function handleAddPetUnauthenticated(e) {
        e.preventDefault();
        closeDrawer();
        onopenAuthModal?.();
    }

    function handleAddPetAuthenticated(e) {
        e.preventDefault();
        closeDrawer();
        openCreateDogModal();
    }

    function handleCreatePost(e) {
        e.preventDefault();
        closeDrawer();
        onopenCreatePostModal?.();
    }

    function handleSearchOpen(e) {
        e.preventDefault();
        closeDrawer();
        openSearchPanel();
    }

    function handleAuthLink(e) {
        e.preventDefault();
        closeDrawer();
        if (authed) {
            if (confirm('Are you sure you want to logout?')) {
                logout();
                setAuthUser(null);
            }
        } else {
            onopenAuthModal?.();
        }
    }

    function selectFeedTab(tab) {
        setFeedTab(tab);
        closeDrawer();
    }

    function navigateTo(path) {
        history.pushState({}, '', path);
        window.dispatchEvent(new CustomEvent('routechange'));
    }

    function handleBellClick() {
        navigateTo('/notifications');
    }

    async function fetchUnread() {
        if (!isAuthenticated()) return;
        try {
            const data = await getUnreadCount();
            unreadCount = data.unreadCount || 0;
        } catch {
            // Silently fail
        }
    }

    async function fetchNotifUnread() {
        if (!isAuthenticated()) return;
        try {
            const data = await getNotifUnreadCount();
            setNotifUnreadCount(data.unreadCount || 0);
        } catch {
            // Silently fail
        }
    }

    $effect(() => {
        // Re-run when auth state or dog list changes
        const _auth = store.authUser;
        const _dv = store.dogVersion;

        let msgInterval = null;
        let notifInterval = null;
        let active = true;

        async function init() {
            const authenticated = isAuthenticated();
            if (authenticated) {
                try {
                    const fetched = await getMyDogs();
                    if (!active) return;
                    dogs = fetched;
                } catch {
                    if (!active) return;
                    dogs = [];
                }
                myDogsLoaded = true;
                fetchUnread();
                fetchNotifUnread();
                msgInterval = setInterval(fetchUnread, 60000);
                notifInterval = setInterval(fetchNotifUnread, 60000);
            } else {
                dogs = [];
                myDogsLoaded = true;
                unreadCount = 0;
                setNotifUnreadCount(0);
            }
        }

        init();

        function handleRouteChange() {
            activePath = window.location.pathname;
            closeDrawer();
        }

        window.addEventListener('routechange', handleRouteChange);

        return () => {
            active = false;
            if (msgInterval) clearInterval(msgInterval);
            if (notifInterval) clearInterval(notifInterval);
            window.removeEventListener('routechange', handleRouteChange);
        };
    });

    // Lock body scroll when drawer is open (mobile only)
    $effect(() => {
        if (drawerOpen && window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    });

    // Close drawer on Escape key
    $effect(() => {
        function onKeyDown(e) {
            if (e.key === 'Escape' && drawerOpen) closeDrawer();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    // Active state helpers
    function isHomeActive() {
        return activePath === '/';
    }

    function isMessagesActive() {
        return activePath.startsWith('/messages');
    }

    function isNotificationsActive() {
        return activePath.startsWith('/notifications');
    }

    function isProfileActive() {
        if (dogs.length > 0) {
            const slug = getSlug(dogs[0]);
            return activePath === `/dog/${slug}`;
        }
        return false;
    }

    let badgeDisplay = $derived(unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null);
    let notifBadgeDisplay = $derived(store.notifUnreadCount > 0 ? (store.notifUnreadCount > 99 ? '99+' : String(store.notifUnreadCount)) : null);
    let isAdmin = $derived(store.authUser?.role === 'admin' || store.authUser?.role === 'moderator');
    let isHome = $derived(activePath === '/');
    let feedLabel = $derived(store.feedTab === 'following' ? 'Following' : 'For You');
</script>

<header>
    <div class="header-content">
        <div class="header-left">
            <button type="button" class="hamburger-btn" aria-label="Open menu" onclick={toggleDrawer}>
                <i class="fas fa-bars"></i>
            </button>
            {#if isHome}
                <span class="header-feed-label">{feedLabel}</span>
            {/if}
        </div>
        <a href="/" data-link class="logo header-logo-desktop">
            <img src="/images/logo.png" alt="Woof Logo">
        </a>
        <div class="header-icons">
            <button
                type="button"
                class="header-bell-btn"
                class:active={isNotificationsActive()}
                class:has-unread={!!notifBadgeDisplay}
                aria-label="Notifications"
                onclick={handleBellClick}
            >
                <i class={notifBadgeDisplay || isNotificationsActive() ? 'fas fa-bell' : 'far fa-bell'} aria-hidden="true"></i>
                {#if notifBadgeDisplay}
                    <span class="header-notif-badge">{notifBadgeDisplay}</span>
                {/if}
            </button>
        </div>
    </div>
</header>

<!-- Drawer backdrop -->
{#if drawerOpen}
    <div class="nav-drawer-backdrop" onclick={closeDrawer} aria-hidden="true"></div>
{/if}

<!-- Navigation drawer -->
<div class="nav-drawer" class:open={drawerOpen} role="dialog" aria-modal="true" aria-label="Navigation menu">
    <div class="nav-drawer-header">
        <button type="button" class="nav-drawer-close" aria-label="Close menu" onclick={closeDrawer}>
            <i class="fas fa-times"></i>
        </button>
        <a href="/" data-link class="nav-drawer-logo" onclick={closeDrawer}>
            <img src="/images/logo.png" alt="Woof">
        </a>
    </div>

    {#if isHome}
        <div class="nav-drawer-section">
            <span class="nav-drawer-section-label">FEED</span>
            <button
                type="button"
                class="nav-drawer-row"
                class:active={store.feedTab !== 'following'}
                onclick={() => selectFeedTab('public')}
            >
                <i class="fas fa-star"></i> For You
            </button>
            <button
                type="button"
                class="nav-drawer-row"
                class:active={store.feedTab === 'following'}
                onclick={() => selectFeedTab('following')}
            >
                <i class="fas fa-heart"></i> Following
            </button>
        </div>
    {/if}

    <ul class="nav-drawer-links">
        <li>
            <a href="/" data-link onclick={closeDrawer} class:active={isHomeActive()}>
                <i class="fas fa-home"></i> Home
            </a>
        </li>
        <li>
            <button type="button" class="nav-btn" onclick={handleSearchOpen}>
                <i class="fas fa-search"></i> Search
            </button>
        </li>
        <li>
            <button type="button" class="nav-btn" onclick={handleCreatePost}>
                <i class="fas fa-plus-square"></i> Create
            </button>
        </li>
        {#if authed}
            <li>
                <a href="/notifications" data-link onclick={closeDrawer} class:active={isNotificationsActive()}>
                    <i class="fas fa-bell"></i> Notifications
                    {#if notifBadgeDisplay}<span class="nav-badge">{notifBadgeDisplay}</span>{/if}
                </a>
            </li>
            <li>
                <a href="/messages" data-link onclick={closeDrawer} class:active={isMessagesActive()}>
                    <i class="fas fa-comment-dots"></i> Messages
                    {#if badgeDisplay}<span class="nav-badge">{badgeDisplay}</span>{/if}
                </a>
            </li>
        {/if}
        {#if isAdmin}
            <li>
                <a href="/admin" data-link onclick={closeDrawer} class:active={activePath.startsWith('/admin')}>
                    <i class="fas fa-shield-alt"></i> Moderation
                </a>
            </li>
        {/if}
        <li>
            {#if !authed}
                <button type="button" class="nav-btn" onclick={handleAddPetUnauthenticated}>
                    <i class="fas fa-plus"></i> Add a Pet
                </button>
            {:else if myDogsLoaded && dogs.length === 0}
                <button type="button" class="nav-btn" onclick={handleAddPetAuthenticated}>
                    <i class="fas fa-plus"></i> Add a Pet
                </button>
            {:else if myDogsLoaded && dogs.length === 1}
                <a href="/dog/{getSlug(dogs[0])}" data-link onclick={closeDrawer} class:active={isProfileActive()}>
                    <img
                        src={dogs[0].profilePhoto || '/images/dog_profile_pic.jpg'}
                        alt={dogs[0].name}
                        class="profile-pic"
                        onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                    />
                    {dogs[0].name}
                </a>
            {:else if myDogsLoaded && dogs.length > 1}
                <a href="/dog/{getSlug(dogs[0])}" data-link onclick={closeDrawer}>
                    <i class="fas fa-paw"></i> My Pets
                </a>
            {/if}
        </li>
    </ul>

    <div class="nav-drawer-footer">
        <button type="button" class="nav-drawer-row" onclick={handleAuthLink}>
            {#if authed}
                <i class="fas fa-sign-out-alt"></i> Logout
            {:else}
                <i class="fas fa-user-circle"></i> Login
            {/if}
        </button>
    </div>
</div>


<nav class="bottom-nav" aria-label="Mobile navigation">
    <a href="/" data-link id="bottom-nav-home" class="bottom-nav-item" aria-label="Home" class:active={isHomeActive()}>
        <i class="fas fa-home"></i>
    </a>
    <button type="button" id="bottom-nav-search" class="bottom-nav-item" aria-label="Search" onclick={handleSearchOpen}>
        <i class="fas fa-search"></i>
    </button>
    <button type="button" id="create-post-link-mobile" class="bottom-nav-item" aria-label="Create post" onclick={handleCreatePost}>
        <i class="fas fa-plus-square"></i>
    </button>
    {#if authed}
        <a href="/messages" data-link id="bottom-nav-messages" class="bottom-nav-item" class:active={isMessagesActive()}>
            <i class="fas fa-comment-dots"></i>
            {#if badgeDisplay}
                <span class="bottom-nav-badge" id="bottom-messages-badge">{badgeDisplay}</span>
            {:else}
                <span class="bottom-nav-badge" id="bottom-messages-badge" style="display:none">0</span>
            {/if}
        </a>
    {:else}
        <a href="/messages" data-link id="bottom-nav-messages" class="bottom-nav-item" style="display:none">
            <i class="fas fa-comment-dots"></i>
            <span class="bottom-nav-badge" id="bottom-messages-badge" style="display:none">0</span>
        </a>
    {/if}
    <a
        href={authed && dogs.length > 0 ? `/dog/${getSlug(dogs[0])}` : '/'}
        id="bottom-nav-profile"
        class="bottom-nav-item"
        aria-label="Profile"
        class:active={isProfileActive()}
        data-link
        onclick={!authed ? handleAddPetUnauthenticated : authed && dogs.length === 0 ? handleAddPetAuthenticated : undefined}
    >
        {#if authed && dogs.length === 1}
            <img
                src={dogs[0].profilePhoto || '/images/dog_profile_pic.jpg'}
                alt={dogs[0].name}
                class="profile-pic"
                onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
            />
        {:else if authed && dogs.length > 1}
            <i class="fas fa-paw"></i>
        {:else if authed && dogs.length === 0}
            <i class="fas fa-plus-circle"></i>
        {:else}
            <i class="fas fa-user-circle"></i>
        {/if}
    </a>
</nav>
