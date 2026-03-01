<script>
    import { getMyDogs, getUnreadCount, getNotifUnreadCount, getFollowingBreeds } from '../../js/api.js';
    import { isAuthenticated, logout } from '../../js/auth.js';
    import { openCreateDogModal, openSearchPanel } from '../../js/modal-store.svelte.js';
    import { store, setAuthUser, setFeedTab, setNotifUnreadCount, setCurrentDog, setUserDogIds } from '../../js/svelte-store.svelte.js';
    import { t, localName, locale, setLocale } from '../../js/i18n-store.svelte.js';

    let { onopenAuthModal = null, onopenCreatePostModal = null } = $props();

    let dogs = $state([]);
    let unreadCount = $state(0);
    let activePath = $state(window.location.pathname);
    let myDogsLoaded = $state(false);
    let drawerOpen = $state(false);
    let authed = $derived(store.authUser !== null);
    let followedBreeds = $state([]);

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
                class:active={store.feedTab !== 'following'}
                onclick={() => selectFeedTab('public')}
            >
                <i class="fas fa-star"></i> {t('nav.forYou')}
            </button>
            <button
                type="button"
                class="nav-drawer-row"
                class:active={store.feedTab === 'following'}
                onclick={() => selectFeedTab('following')}
            >
                <i class="fas fa-heart"></i> {t('nav.following')}
            </button>
        </div>
    {/if}

    <ul class="nav-drawer-links">
        <li>
            <a href="/" data-link onclick={closeDrawer} class:active={isHomeActive()}>
                <i class="fas fa-home"></i> {t('nav.home')}
            </a>
        </li>
        <li>
            <button type="button" class="nav-btn" onclick={handleSearchOpen}>
                <i class="fas fa-search"></i> {t('nav.search')}
            </button>
        </li>
        <li>
            <button type="button" class="nav-btn" onclick={handleCreatePost}>
                <i class="fas fa-plus-square"></i> {t('nav.create')}
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
        {/if}
        {#if isAdmin}
            <li>
                <a href="/admin" data-link onclick={closeDrawer} class:active={activePath.startsWith('/admin')}>
                    <i class="fas fa-shield-alt"></i> {t('nav.moderation')}
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

    <div class="nav-drawer-footer">
        <div class="lang-picker" role="radiogroup" aria-label="Language">
            <button
                type="button"
                class="lang-btn"
                class:active={locale.current === 'en'}
                onclick={() => setLocale('en')}
                aria-checked={locale.current === 'en'}
                role="radio"
            >{t('language.en')}</button>
            <button
                type="button"
                class="lang-btn"
                class:active={locale.current === 'fi'}
                onclick={() => setLocale('fi')}
                aria-checked={locale.current === 'fi'}
                role="radio"
            >{t('language.fi')}</button>
        </div>
        <button type="button" class="nav-drawer-row" onclick={handleAuthLink}>
            {#if authed}
                <i class="fas fa-sign-out-alt"></i> {t('nav.logout')}
            {:else}
                <i class="fas fa-user-circle"></i> {t('nav.login')}
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
        <i class="fas fa-home"></i>
    </a>
    <button type="button" id="bottom-nav-search" class="bottom-nav-item" aria-label={t('nav.search')} onclick={handleSearchOpen}>
        <i class="fas fa-search"></i>
    </button>
    <button type="button" id="create-post-link-mobile" class="bottom-nav-item" aria-label={t('nav.createPost')} onclick={handleCreatePost}>
        <i class="fas fa-plus-square"></i>
    </button>
    {#if authed}
        <a href="/messages" data-link id="bottom-nav-messages" class="bottom-nav-item" class:active={isMessagesActive()} aria-label={t('nav.messages')}>
            <i class="fas fa-comment-dots"></i>
            {#if badgeDisplay}
                <span class="bottom-nav-badge" id="bottom-messages-badge">{badgeDisplay}</span>
            {:else}
                <span class="bottom-nav-badge" id="bottom-messages-badge" style="display:none">0</span>
            {/if}
        </a>
    {:else}
        <a href="/messages" data-link id="bottom-nav-messages" class="bottom-nav-item" style="display:none" aria-label={t('nav.messages')}>
            <i class="fas fa-comment-dots"></i>
            <span class="bottom-nav-badge" id="bottom-messages-badge" style="display:none">0</span>
        </a>
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
    color: var(--color-text);
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
    font-size: 20px;
    color: var(--color-text);
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
    color: var(--color-text-muted);
}

.logo {
    font-size: 24px;
    font-weight: bold;
    color: var(--color-text);
    text-decoration: none;
    display: flex;
    align-items: center;
}

.logo img {
    height: 30px;
    margin-right: 10px;
}

.header-icons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    grid-column: 2;
    padding-right: var(--woof-space-4);
}

.header-icons button {
    font-size: 24px;
    color: var(--color-text);
    cursor: pointer;
    margin-left: 15px;
    transition: color 0.2s;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
}

.header-icons button:hover {
    color: var(--color-text-muted);
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
    top: var(--header-height);
    left: 0;
    bottom: 0;
    width: 280px;
    background: var(--color-surface);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid var(--color-border);
}

.nav-drawer-header {
    display: none;
    align-items: center;
    padding: var(--woof-space-3) var(--woof-space-4);
    border-bottom: 1px solid var(--color-border);
    gap: var(--woof-space-3);
    min-height: var(--header-height);
    box-sizing: border-box;
}

.nav-drawer-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: var(--color-text);
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
    color: var(--color-text-muted);
}

.nav-drawer-logo img {
    height: 28px;
    display: block;
}

.nav-drawer-section {
    padding: var(--woof-space-3) var(--woof-space-4);
    border-bottom: 1px solid var(--color-border);
}

.nav-drawer-section-label {
    font-size: var(--woof-text-caption-2);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--color-text-muted);
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
    color: var(--color-text-secondary);
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    text-decoration: none;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
}

.nav-drawer-row:hover {
    background: var(--color-bg-alt);
    color: var(--color-text);
}

.nav-drawer-row.active {
    color: var(--color-primary);
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
    color: var(--color-text);
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
    background: var(--color-bg-alt);
}

.nav-drawer-links li a.active {
    color: var(--color-primary);
    font-weight: var(--woof-font-weight-semibold);
}

.nav-drawer-links li a i,
.nav-drawer-links li button i {
    width: 20px;
    text-align: center;
}

.nav-drawer-links .profile-pic {
    width: 24px;
    height: 24px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
}

.nav-drawer-explore {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-brand-primary);
    margin-top: var(--woof-space-1);
}

.nav-drawer-explore:hover {
    color: var(--color-primary-hover);
}

.nav-drawer-footer {
    padding: var(--woof-space-3) var(--woof-space-4);
    border-top: 1px solid var(--color-border);
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
    background-color: var(--color-surface);
    border-top: 1px solid var(--color-border);
    z-index: 1000;
}

.bottom-nav a,
.bottom-nav button {
    color: var(--color-text);
    text-decoration: none;
    font-size: 24px;
    padding: 10px 0;
    flex: 1;
    position: relative;
    text-align: center;
    background: none;
    border: none;
    font-family: inherit;
    cursor: pointer;
}

.bottom-nav a.active,
.bottom-nav button.active {
    color: var(--color-primary);
}

.bottom-nav a i,
.bottom-nav button i {
    display: block;
    line-height: 1;
}

.bottom-nav a .profile-pic {
    width: 24px;
    height: 24px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    object-position: center;
    display: inline-block;
}

/* Navigation badges */
.nav-badge {
    background: var(--color-primary);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    margin-left: 6px;
    vertical-align: middle;
}

.bottom-nav-badge {
    position: absolute;
    top: 2px;
    right: calc(50% - 16px);
    background: var(--color-like);
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
    font-size: 22px;
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
    top: 4px;
    right: 4px;
    background: var(--color-primary);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-2);
    font-weight: var(--woof-font-weight-bold);
    min-width: 16px;
    height: 16px;
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
        justify-content: space-around;
        align-items: center;
    }

    .bottom-nav a,
    .bottom-nav button {
        color: var(--color-text);
        text-decoration: none;
        font-size: 24px;
        padding: 10px 0;
        flex: 1;
        text-align: center;
        background: none;
        border: none;
        font-family: inherit;
        cursor: pointer;
    }

    .bottom-nav a .profile-pic {
        width: 24px;
        height: 24px;
        border-radius: var(--woof-radius-full);
        object-fit: cover;
        object-position: center;
        display: inline-block;
    }
}

@media (min-width: 769px) {
    .bottom-nav {
        display: none;
    }
}

/* Language picker */
.lang-picker {
    display: flex;
    gap: 0;
    margin: 0 var(--woof-space-3) var(--woof-space-2);
    border-radius: var(--woof-radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-border);
}

.lang-btn {
    flex: 1;
    padding: var(--woof-space-1) var(--woof-space-3);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: none;
    cursor: pointer;
    transition: background var(--woof-duration-fast), color var(--woof-duration-fast);
}

.lang-btn:first-child {
    border-right: 1px solid var(--color-border);
}

.lang-btn:hover {
    background: var(--color-bg-alt);
}

.lang-btn.active {
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
}
</style>
