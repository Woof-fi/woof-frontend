<script>
    import { getMyDogs, getUnreadCount, getNotifUnreadCount, getFollowingBreeds, getFollowingTerritories, getFollowingDogParks } from '../../js/api.js';
    import { isAuthenticated, logout } from '../../js/auth.js';
    import { openCreateDogModal, openSearchPanel, openCreateActionSheet } from '../../js/modal-store.svelte.js';
    import { store, setAuthUser, setFeedTab, setNotifUnreadCount, setCurrentDog, setUserDogIds } from '../../js/svelte-store.svelte.js';
    import { t, localName } from '../../js/i18n-store.svelte.js';

    let { onopenAuthModal = null } = $props();

    let dogs = $state([]);
    let unreadCount = $state(0);
    let activePath = $state(window.location.pathname);
    let myDogsLoaded = $state(false);
    let drawerOpen = $state(false);
    let authed = $derived(store.authUser !== null);
    let followedBreeds = $state([]);
    let followedTerritories = $state([]);
    let followedParks = $state([]);

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
        openCreateActionSheet();
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
            if (confirm(t('nav.logoutConfirm'))) {
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
        // Use live URL — activePath may be stale after popstate
        const currentUrl = window.location.pathname;
        if (currentUrl.startsWith('/notifications')) {
            // Already on notifications — go back
            history.back();
        } else {
            navigateTo('/notifications');
        }
    }

    function handleHomeClick(e) {
        const currentUrl = window.location.pathname;
        if (currentUrl === '/') {
            // Already on home — scroll to top instead of navigating
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Otherwise let the data-link handler navigate normally
    }

    function handleLogoClick(e) {
        const currentUrl = window.location.pathname;
        if (currentUrl === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
                    setUserDogIds(fetched.map(d => d.id));
                    if (fetched.length > 0) setCurrentDog(fetched[0]);
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
                setUserDogIds([]);
                setCurrentDog(null);
            }
        }

        init();

        function handleRouteChange() {
            activePath = window.location.pathname;
            closeDrawer();
        }

        // Sync activePath on browser back/forward (popstate) too
        function handlePopstateNav() {
            activePath = window.location.pathname;
        }

        window.addEventListener('routechange', handleRouteChange);
        window.addEventListener('popstate', handlePopstateNav);

        return () => {
            active = false;
            if (msgInterval) clearInterval(msgInterval);
            if (notifInterval) clearInterval(notifInterval);
            window.removeEventListener('routechange', handleRouteChange);
            window.removeEventListener('popstate', handlePopstateNav);
        };
    });

    // Fetch followed breeds — re-runs on auth change and breedVersion bumps
    $effect(() => {
        const _auth = store.authUser;
        const _bv = store.breedVersion;

        if (!isAuthenticated()) {
            followedBreeds = [];
            return;
        }

        let active = true;
        (async () => {
            try {
                const breeds = await getFollowingBreeds();
                if (active) followedBreeds = breeds;
            } catch {
                if (active) followedBreeds = [];
            }
        })();
        return () => { active = false; };
    });

    // Fetch followed territories — re-runs on auth change and territoryVersion bumps
    $effect(() => {
        const _auth = store.authUser;
        const _tv = store.territoryVersion;

        if (!isAuthenticated()) {
            followedTerritories = [];
            return;
        }

        let active = true;
        (async () => {
            try {
                const territories = await getFollowingTerritories();
                if (active) followedTerritories = territories;
            } catch {
                if (active) followedTerritories = [];
            }
        })();
        return () => { active = false; };
    });

    // Fetch followed parks — re-runs on auth change and parkVersion bumps
    $effect(() => {
        const _auth = store.authUser;
        const _pv = store.parkVersion;

        if (!isAuthenticated()) {
            followedParks = [];
            return;
        }

        let active = true;
        (async () => {
            try {
                const parks = await getFollowingDogParks();
                if (active) followedParks = parks;
            } catch {
                if (active) followedParks = [];
            }
        })();
        return () => { active = false; };
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
    let feedLabel = $derived(store.feedTab === 'following' ? t('nav.following') : t('nav.forYou'));
</script>

<header>
    <div class="header-content">
        <div class="header-left">
            <button type="button" class="hamburger-btn" aria-label={t('nav.openMenu')} onclick={toggleDrawer}>
                <i class="fas fa-bars"></i>
            </button>
            {#if isHome}
                <span class="header-feed-label">{feedLabel}</span>
            {/if}
        </div>
        <a href="/" data-link class="logo header-logo-desktop" onclick={handleLogoClick}>
            <img src="/images/logo.png" alt="Woof Logo">
        </a>
        <div class="header-icons">
            <button
                type="button"
                class="header-bell-btn"
                class:active={isNotificationsActive()}
                class:has-unread={!!notifBadgeDisplay}
                aria-label={t('nav.notifications')}
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
<div class="nav-drawer" class:open={drawerOpen} role="dialog" aria-modal="true" aria-label={t('nav.openMenu')}>
    <div class="nav-drawer-header">
        <button type="button" class="nav-drawer-close" aria-label={t('nav.closeMenu')} onclick={closeDrawer}>
            <i class="fas fa-times"></i>
        </button>
        <a href="/" data-link class="nav-drawer-logo" onclick={closeDrawer}>
            <img src="/images/logo.png" alt="Woof">
        </a>
    </div>

    {#if isHome}
        <div class="nav-drawer-section">
            <span class="nav-drawer-section-label">{t('nav.feed')}</span>
            <button
                type="button"
                class="nav-drawer-row"
                class:active={store.feedTab === 'following'}
                onclick={() => selectFeedTab('following')}
            >
                <i class="fas fa-heart"></i> {t('nav.following')}
            </button>
            <button
                type="button"
                class="nav-drawer-row"
                class:active={store.feedTab !== 'following'}
                onclick={() => selectFeedTab('public')}
            >
                <i class="fas fa-star"></i> {t('nav.forYou')}
            </button>
        </div>
    {/if}

    <ul class="nav-drawer-links">
        <li>
            <a href="/" data-link onclick={closeDrawer} class:active={isHomeActive()}>
                <i class="fas fa-house"></i> {t('nav.home')}
            </a>
        </li>
        <li>
            <button type="button" class="nav-btn" onclick={handleSearchOpen}>
                <i class="fas fa-magnifying-glass"></i> {t('nav.search')}
            </button>
        </li>
        <li>
            <button type="button" class="nav-btn" onclick={handleCreatePost}>
                <i class="fas fa-square-plus"></i> {t('nav.create')}
            </button>
        </li>
        {#if authed}
            <li>
                <a href="/notifications" data-link onclick={closeDrawer} class:active={isNotificationsActive()}>
                    <i class="fas fa-bell"></i> {t('nav.notifications')}
                    {#if notifBadgeDisplay}<span class="nav-badge">{notifBadgeDisplay}</span>{/if}
                </a>
            </li>
            <li>
                <a href="/messages" data-link onclick={closeDrawer} class:active={isMessagesActive()}>
                    <i class="fas fa-comment-dots"></i> {t('nav.messages')}
                    {#if badgeDisplay}<span class="nav-badge">{badgeDisplay}</span>{/if}
                </a>
            </li>
            <li>
                <a href="/bookmarks" data-link onclick={closeDrawer} class:active={activePath.startsWith('/bookmarks')}>
                    <i class="fas fa-bookmark"></i> {t('nav.favourites')}
                </a>
            </li>
            <li>
                <a href="/settings" data-link onclick={closeDrawer} class:active={activePath.startsWith('/settings')}>
                    <i class="fas fa-gear"></i> {t('nav.settings')}
                </a>
            </li>
        {:else}
            <li>
                <button type="button" class="nav-btn" onclick={handleAddPetUnauthenticated}>
                    <i class="fas fa-bell"></i> {t('nav.notifications')}
                </button>
            </li>
            <li>
                <button type="button" class="nav-btn" onclick={handleAddPetUnauthenticated}>
                    <i class="fas fa-comment-dots"></i> {t('nav.messages')}
                </button>
            </li>
            <li>
                <button type="button" class="nav-btn" onclick={handleAddPetUnauthenticated}>
                    <i class="fas fa-bookmark"></i> {t('nav.favourites')}
                </button>
            </li>
        {/if}
        {#if isAdmin}
            <li>
                <a href="/admin" data-link onclick={closeDrawer} class:active={activePath.startsWith('/admin')}>
                    <i class="fas fa-shield-halved"></i> {t('nav.moderation')}
                </a>
            </li>
        {/if}
        <li>
            {#if !authed}
                <button type="button" class="nav-btn" onclick={handleAddPetUnauthenticated}>
                    <i class="fas fa-plus"></i> {t('nav.addPet')}
                </button>
            {:else if myDogsLoaded && dogs.length === 0}
                <button type="button" class="nav-btn" onclick={handleAddPetAuthenticated}>
                    <i class="fas fa-plus"></i> {t('nav.addPet')}
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
                    <i class="fas fa-paw"></i> {t('nav.myPets')}
                </a>
            {/if}
        </li>
    </ul>

    {#if authed && followedBreeds.length > 0}
        <div class="nav-drawer-section">
            <span class="nav-drawer-section-label">{t('nav.breeds')}</span>
            {#each followedBreeds.slice(0, 5) as breed (breed.id)}
                <a href="/breed/{breed.slug}" data-link onclick={closeDrawer}
                   class="nav-drawer-row" class:active={activePath === `/breed/${breed.slug}`}>
                    <i class="fas fa-paw"></i> {localName(breed)}
                </a>
            {/each}
            <a href="/breeds" data-link onclick={closeDrawer} class="nav-drawer-row nav-drawer-explore">
                {t('nav.exploreBreeds')}
            </a>
        </div>
    {/if}

    {#if authed && followedTerritories.length > 0}
        <div class="nav-drawer-section">
            <span class="nav-drawer-section-label">{t('nav.territories')}</span>
            {#each followedTerritories.slice(0, 5) as ter (ter.id)}
                <a href={`/territory/${ter.urlPath || ter.slug}`} data-link onclick={closeDrawer}
                   class="nav-drawer-row" class:active={activePath.startsWith(`/territory/${ter.urlPath || ter.slug}`)}>
                    <i class="fas fa-location-dot"></i> {localName(ter)}
                </a>
            {/each}
            <a href="/territories" data-link onclick={closeDrawer} class="nav-drawer-row nav-drawer-explore">
                {t('nav.exploreTerritories')}
            </a>
        </div>
    {/if}

    {#if authed && followedParks.length > 0}
        <div class="nav-drawer-section">
            <span class="nav-drawer-section-label">{t('nav.dogParks')}</span>
            {#each followedParks.slice(0, 5) as park (park.id)}
                <a href="/dog-park/{park.slug}" data-link onclick={closeDrawer}
                   class="nav-drawer-row" class:active={activePath === `/dog-park/${park.slug}`}>
                    <i class="fas fa-tree"></i> {localName(park)}
                </a>
            {/each}
        </div>
    {/if}

    <div class="nav-drawer-footer">
        <button type="button" class="nav-drawer-row" onclick={handleAuthLink}>
            {#if authed}
                <i class="fas fa-right-from-bracket"></i> {t('nav.logout')}
            {:else}
                <i class="fas fa-circle-user"></i> {t('nav.login')}
            {/if}
        </button>
        <div class="nav-legal-links">
            <a href="/privacy" data-link onclick={closeDrawer}>{t('nav.privacy')}</a>
            <span class="nav-legal-sep" aria-hidden="true">·</span>
            <a href="/terms" data-link onclick={closeDrawer}>{t('nav.terms')}</a>
        </div>
    </div>
</div>


<nav class="bottom-nav" aria-label="Mobile navigation">
    <a href="/" data-link id="bottom-nav-home" class="bottom-nav-item" aria-label={t('nav.home')} class:active={isHomeActive()} onclick={handleHomeClick}>
        <i class="fas fa-house"></i>
    </a>
    <button type="button" id="bottom-nav-search" class="bottom-nav-item" aria-label={t('nav.search')} onclick={handleSearchOpen}>
        <i class="fas fa-magnifying-glass"></i>
    </button>
    <div class="bottom-nav-fab-slot">
        <button type="button" id="create-post-link-mobile" class="bottom-nav-fab" aria-label={t('nav.createPost')} onclick={handleCreatePost}>
            <i class="fas fa-plus"></i>
        </button>
    </div>
    {#if authed}
        <a href="/messages" data-link id="bottom-nav-messages" class="bottom-nav-item" class:active={isMessagesActive()} aria-label={t('nav.messages')}>
            <i class="fas fa-comment-dots"></i>
            {#if badgeDisplay}
                <span class="bottom-nav-badge" id="bottom-messages-badge">{badgeDisplay}</span>
            {/if}
        </a>
    {:else}
        <button type="button" id="bottom-nav-messages" class="bottom-nav-item" aria-label={t('nav.messages')} onclick={handleAddPetUnauthenticated}>
            <i class="fas fa-comment-dots"></i>
        </button>
    {/if}
    <a
        href={authed && dogs.length > 0 ? `/dog/${getSlug(dogs[0])}` : '/'}
        id="bottom-nav-profile"
        class="bottom-nav-item"
        aria-label={t('nav.profile')}
        class:active={isProfileActive()}
        data-link
        onclick={!authed ? handleAddPetUnauthenticated : authed && dogs.length === 0 ? handleAddPetAuthenticated : undefined}
    >
        {#key `${authed}-${dogs.length}`}
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
                <i class="fas fa-circle-user"></i>
            {/if}
        {/key}
    </a>
</nav>

<!-- Desktop floating FAB (right side) -->
<button type="button" class="desktop-fab" aria-label={t('nav.createPost')} onclick={handleCreatePost}>
    <i class="fas fa-plus"></i>
</button>

<style>
.header-content {
    display: grid;
    grid-template-columns: 280px 1fr;
    align-items: center;
    width: 100%;
    height: 100%;
}

.header-left {
    display: none;
    align-items: center;
    gap: var(--woof-space-2);
}

.header-feed-label {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    display: none;
}

.header-logo-desktop {
    display: flex;
    padding: 0 var(--woof-space-4);
}

.hamburger-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--woof-text-title-3);
    color: var(--woof-color-neutral-900);
    padding: var(--woof-space-2);
    border-radius: var(--woof-radius-sm);
    transition: color var(--woof-duration-fast);
    display: none;
    align-items: center;
    min-width: var(--woof-touch-target);
    min-height: var(--woof-touch-target);
    justify-content: center;
}

.hamburger-btn:hover {
    color: var(--woof-color-neutral-400);
}

.logo {
    font-size: var(--woof-nav-icon-size);
    font-weight: bold;
    color: var(--woof-color-neutral-900);
    text-decoration: none;
    display: flex;
    align-items: center;
}

.logo img {
    height: 30px;
    margin-right: var(--woof-space-3);
}

.header-icons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    grid-column: 2;
    padding-right: var(--woof-space-4);
}

.header-icons button {
    font-size: var(--woof-nav-icon-size);
    color: var(--woof-color-neutral-900);
    cursor: pointer;
    margin-left: var(--woof-space-4);
    transition: color 0.2s;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
}

.header-icons button:hover {
    color: var(--woof-color-neutral-400);
}

/* Navigation Drawer */
.nav-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: var(--woof-surface-overlay);
    z-index: 1100;
    display: none;
}

.nav-drawer {
    position: fixed;
    top: var(--woof-header-height);
    left: 0;
    bottom: 0;
    width: 280px;
    background: var(--woof-surface-primary);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid var(--woof-color-neutral-200);
}

.nav-drawer-header {
    display: none;
    align-items: center;
    padding: var(--woof-space-3) var(--woof-space-4);
    border-bottom: 1px solid var(--woof-color-neutral-200);
    gap: var(--woof-space-3);
    min-height: var(--woof-header-height);
    box-sizing: border-box;
}

.nav-drawer-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--woof-text-headline);
    color: var(--woof-color-neutral-900);
    padding: var(--woof-space-2);
    border-radius: var(--woof-radius-sm);
    display: none;
    align-items: center;
    justify-content: center;
    min-width: var(--woof-touch-target);
    min-height: var(--woof-touch-target);
    transition: color var(--woof-duration-fast);
}

.nav-drawer-close:hover {
    color: var(--woof-color-neutral-400);
}

.nav-drawer-logo img {
    height: var(--woof-avatar-xs);
    display: block;
}

.nav-drawer-section {
    padding: var(--woof-space-3) var(--woof-space-4);
    border-bottom: 1px solid var(--woof-color-neutral-200);
}

.nav-drawer-section-label {
    font-size: var(--woof-text-caption-2);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-400);
    letter-spacing: 0.08em;
    display: block;
    margin-bottom: var(--woof-space-2);
}

.nav-drawer-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    background: none;
    border: none;
    border-radius: var(--woof-radius-sm);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-500);
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    text-decoration: none;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
}

.nav-drawer-row:hover {
    background: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-900);
}

.nav-drawer-row.active {
    color: var(--woof-color-brand-primary);
    font-weight: var(--woof-font-weight-semibold);
}

.nav-drawer-links {
    list-style: none;
    padding: var(--woof-space-3) var(--woof-space-4);
    margin: 0;
    flex: 1;
}

.nav-drawer-links li {
    margin-bottom: var(--woof-space-1);
}

.nav-drawer-links li a,
.nav-drawer-links li button {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-2) var(--woof-space-3);
    border-radius: var(--woof-radius-sm);
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-900);
    text-decoration: none;
    transition: background var(--woof-duration-fast);
    background: none;
    border: none;
    width: 100%;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
}

.nav-drawer-links li a:hover,
.nav-drawer-links li button:hover {
    background: var(--woof-color-neutral-100);
}

.nav-drawer-links li a.active {
    color: var(--woof-color-brand-primary);
    font-weight: var(--woof-font-weight-semibold);
}

.nav-drawer-links li a i,
.nav-drawer-links li button i {
    width: var(--woof-space-5);
    text-align: center;
}

.nav-drawer-links .profile-pic {
    width: var(--woof-nav-icon-size);
    height: var(--woof-nav-icon-size);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
}

.nav-drawer-explore {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-brand-primary);
    margin-top: var(--woof-space-1);
}

.nav-drawer-explore:hover {
    color: var(--woof-color-brand-primary-dark);
}

.nav-drawer-footer {
    padding: var(--woof-space-3) var(--woof-space-4);
    border-top: 1px solid var(--woof-color-neutral-200);
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
}

.nav-legal-links {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: 0 var(--woof-space-3);
}

.nav-legal-links a {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-400);
    text-decoration: none;
    transition: color var(--woof-duration-fast);
}

.nav-legal-links a:hover {
    color: var(--woof-color-neutral-600);
}

.nav-legal-sep {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-300);
}

/* Bottom navigation */
.bottom-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    background-color: var(--woof-surface-primary);
    border-top: 1px solid var(--woof-color-neutral-200);
    z-index: 1000;
}

.bottom-nav .bottom-nav-item {
    color: var(--woof-color-neutral-900);
    text-decoration: none;
    font-size: var(--woof-nav-icon-size);
    padding: 14px 0;
    width: var(--woof-touch-target);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-family: inherit;
    cursor: pointer;
}

.bottom-nav .bottom-nav-item.active {
    color: var(--woof-color-brand-primary);
}

.bottom-nav .bottom-nav-item i {
    display: block;
    line-height: 1;
}

.bottom-nav .bottom-nav-item .profile-pic {
    width: var(--woof-nav-icon-size);
    height: var(--woof-nav-icon-size);
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    object-position: center;
    display: inline-block;
}

/* FAB slot — no flex, just centers the button at its natural size */
.bottom-nav-fab-slot {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Crimson FAB — mobile bottom nav create button */
.bottom-nav .bottom-nav-fab {
    position: relative;
    width: var(--woof-avatar-lg);
    height: var(--woof-avatar-lg);
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--woof-text-title-2);
    margin-top: calc(-1 * var(--woof-space-5));
    box-shadow: var(--woof-shadow-brand);
    transition: transform var(--woof-duration-fast), box-shadow var(--woof-duration-fast);
    padding: 0;
    flex: 0 0 var(--woof-avatar-lg);
}

.bottom-nav .bottom-nav-fab:hover {
    transform: scale(1.08);
    box-shadow: var(--woof-shadow-lg);
}

.bottom-nav .bottom-nav-fab:active {
    transform: scale(0.95);
}

.bottom-nav .bottom-nav-fab i {
    display: block;
    line-height: 1;
    color: var(--woof-color-neutral-0);
}

/* Navigation badges */
.nav-badge {
    background: var(--woof-color-brand-primary);
    color: white;
    font-size: var(--woof-text-caption-2);
    font-weight: 700;
    min-width: var(--woof-space-4);
    height: var(--woof-space-4);
    border-radius: var(--woof-radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--woof-space-1);
    margin-left: var(--woof-space-2);
    vertical-align: middle;
}

.bottom-nav-badge {
    position: absolute;
    top: 2px;
    right: calc(50% - 16px);
    background: var(--woof-color-like);
    color: white;
    font-size: 9px;
    font-weight: 700;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
}

/* Header bell button */
.header-bell-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--woof-text-title-2);
    color: var(--woof-color-neutral-500);
    padding: var(--woof-space-2);
    border-radius: var(--woof-radius-sm);
    transition: color var(--woof-duration-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--woof-touch-target);
    min-height: var(--woof-touch-target);
    position: relative;
    margin-left: 0;
}

.header-bell-btn:hover {
    color: var(--woof-color-neutral-700);
}

.header-bell-btn.active,
.header-bell-btn.has-unread {
    color: var(--woof-color-brand-primary);
}

.header-notif-badge {
    position: absolute;
    top: var(--woof-space-1);
    right: var(--woof-space-1);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-2);
    font-weight: var(--woof-font-weight-bold);
    min-width: var(--woof-space-4);
    height: var(--woof-space-4);
    border-radius: var(--woof-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    box-sizing: border-box;
    line-height: 1;
    pointer-events: none;
}

@media (max-width: 768px) {
    .nav-drawer {
        top: 0;
        z-index: 1101;
        transform: translateX(-100%);
        transition: transform var(--woof-duration-normal) var(--woof-ease-out);
        box-shadow: var(--woof-shadow-lg);
        border-right: none;
    }
    .nav-drawer.open { transform: translateX(0); }
    .nav-drawer-header { display: flex; }

    .header-content {
        grid-template-columns: 1fr auto 1fr;
        max-width: 975px;
        margin: 0 auto;
    }
    .header-logo-desktop { padding: 0; }
    .header-icons { grid-column: 3; padding-right: 0; }

    .header-left { display: flex; }
    .nav-drawer-backdrop { display: block; }
    .nav-drawer-close { display: flex; }
    .hamburger-btn { display: flex; }
    .header-feed-label { display: inline; }
    .header-logo-desktop { display: flex; }

    .bottom-nav {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
    }
}

@media (min-width: 769px) {
    .bottom-nav {
        display: none;
    }
}

/* Desktop floating FAB (right side) */
.desktop-fab {
    display: none;
}

@media (min-width: 769px) {
    .desktop-fab {
        display: flex;
        position: fixed;
        bottom: var(--woof-space-8);
        right: var(--woof-space-8);
        width: var(--woof-avatar-lg);
        height: var(--woof-avatar-lg);
        border-radius: var(--woof-radius-full);
        background: var(--woof-color-brand-primary);
        color: var(--woof-color-neutral-0);
        border: none;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        font-size: var(--woof-text-title-2);
        box-shadow: var(--woof-shadow-brand);
        z-index: 100;
        transition: transform var(--woof-duration-fast), box-shadow var(--woof-duration-fast);
    }

    .desktop-fab:hover {
        transform: scale(1.08);
        box-shadow: var(--woof-shadow-lg);
    }

    .desktop-fab:active {
        transform: scale(0.95);
    }
}
</style>
