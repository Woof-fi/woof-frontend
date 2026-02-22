<script>
    import { getMyDogs, getUnreadCount } from '../../js/api.js';
    import { isAuthenticated, logout } from '../../js/auth.js';

    let { onopenAuthModal = null, onopenCreatePostModal = null } = $props();

    let dogs = $state([]);
    let unreadCount = $state(0);
    let activePath = $state(window.location.pathname);
    let myDogsLoaded = $state(false);
    let authed = $state(isAuthenticated());

    function getSlug(dog) {
        return dog.slug ?? `${dog.name.toLowerCase()}-${dog.displayId}`;
    }

    function handleAddPetUnauthenticated(e) {
        e.preventDefault();
        onopenAuthModal?.();
    }

    function handleAddPetAuthenticated(e) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openCreateDogModal'));
    }

    function handleCreatePost(e) {
        e.preventDefault();
        onopenCreatePostModal?.();
    }

    function handleSearchOpen(e) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openSearchPanel'));
    }

    function handleAuthLink(e) {
        e.preventDefault();
        if (authed) {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        } else {
            onopenAuthModal?.();
        }
    }

    function handleLogout(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            logout();
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

    $effect(() => {
        let interval = null;

        async function init() {
            authed = isAuthenticated();
            if (authed) {
                try {
                    dogs = await getMyDogs();
                } catch {
                    dogs = [];
                }
                myDogsLoaded = true;
                fetchUnread();
                interval = setInterval(fetchUnread, 60000);
            } else {
                dogs = [];
                myDogsLoaded = true;
                unreadCount = 0;
            }
        }

        init();

        function handleAuthChange() {
            if (interval) clearInterval(interval);
            init();
        }

        function handleRouteChange() {
            activePath = window.location.pathname;
        }

        window.addEventListener('auth-state-changed', handleAuthChange);
        window.addEventListener('routechange', handleRouteChange);

        return () => {
            if (interval) clearInterval(interval);
            window.removeEventListener('auth-state-changed', handleAuthChange);
            window.removeEventListener('routechange', handleRouteChange);
        };
    });

    // Active state helpers
    function isHomeActive() {
        return activePath === '/';
    }

    function isMessagesActive() {
        return activePath.startsWith('/messages');
    }

    function isProfileActive() {
        if (dogs.length > 0) {
            const slug = getSlug(dogs[0]);
            return activePath === `/dog/${slug}`;
        }
        return false;
    }

    let badgeDisplay = $derived(unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null);
</script>

<header>
    <div class="header-content">
        <a href="/" data-link class="logo">
            <img src="/assets/images/logo.png" alt="Woof Logo">
        </a>
        <div class="header-icons">
            <a href="#" id="desktop-search-button" aria-label="Search" onclick={handleSearchOpen}>
                <i class="fas fa-search"></i>
            </a>
            <a href="#" class="auth-link" aria-label={authed ? 'Logout' : 'Login'} onclick={handleAuthLink}>
                {#if authed}
                    <i class="fas fa-sign-out-alt"></i> Logout
                {:else}
                    <i class="fas fa-user-circle"></i> Login
                {/if}
            </a>
        </div>
    </div>
</header>

<nav class="left-panel">
    <ul id="nav-links">
        <li>
            <a href="/" data-link><i class="fas fa-home"></i> Home</a>
        </li>
        <li>
            <button type="button" id="create-post-link" class="nav-btn" onclick={handleCreatePost}>
                <i class="fas fa-plus-square"></i> Create
            </button>
        </li>
        {#if authed}
            <li id="messages-nav-item">
                <a href="/messages" data-link>
                    <i class="fas fa-envelope"></i> Messages
                    {#if badgeDisplay}
                        <span class="nav-badge" id="messages-badge">{badgeDisplay}</span>
                    {:else}
                        <span class="nav-badge" id="messages-badge" style="display:none">0</span>
                    {/if}
                </a>
            </li>
        {:else}
            <li id="messages-nav-item" style="display:none">
                <a href="/messages" data-link>
                    <i class="fas fa-envelope"></i> Messages
                    <span class="nav-badge" id="messages-badge" style="display:none">0</span>
                </a>
            </li>
        {/if}
        <li id="profile-nav-item">
            {#if !authed}
                <button type="button" class="nav-btn auth-link" onclick={handleAddPetUnauthenticated}>
                    <i class="fas fa-plus"></i> Add a Pet
                </button>
            {:else if myDogsLoaded && dogs.length === 0}
                <button type="button" id="add-pet-link" class="nav-btn" onclick={handleAddPetAuthenticated}>
                    <i class="fas fa-plus"></i> Add a Pet
                </button>
            {:else if myDogsLoaded && dogs.length === 1}
                <a href="/dog/{getSlug(dogs[0])}" data-link>
                    <img
                        src={dogs[0].profilePhoto || '/assets/images/dog_profile_pic.jpg'}
                        alt={dogs[0].name}
                        class="profile-pic"
                        onerror={(e) => { e.target.src = '/assets/images/dog_profile_pic.jpg'; }}
                    />
                    {dogs[0].name}
                </a>
            {:else if myDogsLoaded && dogs.length > 1}
                <a href="/dog/{getSlug(dogs[0])}" data-link>
                    <i class="fas fa-paw"></i> My Pets
                </a>
            {/if}
        </li>
    </ul>
</nav>

<nav class="bottom-nav" aria-label="Mobile navigation">
    <a href="/" data-link id="bottom-nav-home" class="bottom-nav-item" class:active={isHomeActive()}>
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
            <i class="fas fa-envelope"></i>
            {#if badgeDisplay}
                <span class="bottom-nav-badge" id="bottom-messages-badge">{badgeDisplay}</span>
            {:else}
                <span class="bottom-nav-badge" id="bottom-messages-badge" style="display:none">0</span>
            {/if}
        </a>
    {:else}
        <a href="/messages" data-link id="bottom-nav-messages" class="bottom-nav-item" style="display:none">
            <i class="fas fa-envelope"></i>
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
                src={dogs[0].profilePhoto || '/assets/images/dog_profile_pic.jpg'}
                alt={dogs[0].name}
                class="profile-pic"
                onerror={(e) => { e.target.src = '/assets/images/dog_profile_pic.jpg'; }}
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
