<script>
    import { getDogPark, updateAdminDogPark, getAllTerritories, followDogPark, unfollowDogPark, suggestParkAmenity, scheduleParkVisit, cancelParkVisit, getUpcomingParkVisits, getMyDogs } from '../../js/api.js';
    import { t, localName, locale } from '../../js/i18n-store.svelte.js';
    import { store, bumpParkVersion } from '../../js/svelte-store.svelte.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';

    let { params = {} } = $props();

    let park = $state(null);
    let loading = $state(true);
    let loadError = $state(false);

    // Follow state
    let isFollowing = $state(false);
    let followerCount = $state(0);
    let followLoading = $state(false);

    // Visits state
    let visits = $state([]);
    let visitsLoading = $state(false);
    let showVisitForm = $state(false);
    let visitSubmitting = $state(false);
    let myDogs = $state([]);
    let visitForm = $state({ dogId: '', arrivalAt: '', durationMinutes: 60, note: '' });

    // Amenity suggestion state
    let showAmenitySuggest = $state(false);
    let amenitySuggestForm = $state({});
    let amenitySuggestSubmitting = $state(false);
    let amenitySuggestSuccess = $state(false);

    // Admin edit state
    let isAdmin = $derived(
        store.authUser && (store.authUser.role === 'admin' || store.authUser.role === 'moderator')
    );
    let editing = $state(false);
    let saving = $state(false);
    let editForm = $state({});
    let territories = $state([]);

    let authed = $derived(store.authUser !== null);

    async function startEdit() {
        await reloadPark(params.slug);
        editForm = {
            name: park.name || '',
            nameFi: park.nameFi || '',
            parkType: park.parkType || 'all_sizes',
            territoryId: park.territory?.id || '',
            address: park.address || '',
            sizeM2: park.sizeM2 || '',
            description: park.description || '',
            descriptionFi: park.descriptionFi || '',
            amenities: { ...park.amenities },
        };
        if (territories.length === 0) loadTerritories();
        editing = true;
    }

    function cancelEdit() {
        editing = false;
    }

    async function loadTerritories() {
        territories = await getAllTerritories();
    }

    async function saveEdit() {
        saving = true;
        try {
            const updates = {};
            if (editForm.name !== (park.name || '')) updates.name = editForm.name;
            if (editForm.nameFi !== (park.nameFi || '')) updates.nameFi = editForm.nameFi;
            if (editForm.parkType !== park.parkType) updates.parkType = editForm.parkType;
            if (editForm.territoryId !== (park.territory?.id || '')) updates.territoryId = editForm.territoryId;
            if (editForm.address !== (park.address || '')) updates.address = editForm.address;
            const newSize = editForm.sizeM2 === '' ? null : parseInt(editForm.sizeM2, 10);
            if (newSize !== park.sizeM2) updates.sizeM2 = newSize;
            if (editForm.description !== (park.description || '')) updates.description = editForm.description;
            if (editForm.descriptionFi !== (park.descriptionFi || '')) updates.descriptionFi = editForm.descriptionFi;
            updates.amenities = editForm.amenities;

            if (Object.keys(updates).length > 0) {
                await updateAdminDogPark(park.id, updates);
                await reloadPark(params.slug);
            }
            editing = false;
        } catch (e) {
            console.error('Failed to save park:', e);
            showToast(t('common.failedLoad'), 'error');
        }
        saving = false;
    }

    function toggleAmenity(key) {
        editForm.amenities = {
            ...editForm.amenities,
            [key]: !editForm.amenities[key],
        };
    }

    const parkTypeLabel = (type) => {
        const map = { all_sizes: 'dogPark.allSizes', separate_areas: 'dogPark.separateAreas' };
        return t(map[type] || 'dogPark.allSizes');
    };

    const amenityKeys = ['fenced', 'lighting', 'trash_bins', 'water', 'benches', 'agility', 'shelter'];
    const amenityIcons = {
        fenced: 'fa-shield-halved',
        lighting: 'fa-lightbulb',
        trash_bins: 'fa-trash-can',
        water: 'fa-droplet',
        benches: 'fa-chair',
        agility: 'fa-person-running',
        shelter: 'fa-umbrella',
    };
    const amenityI18n = {
        fenced: 'dogPark.fenced',
        lighting: 'dogPark.lighting',
        trash_bins: 'dogPark.trashBins',
        water: 'dogPark.water',
        benches: 'dogPark.benches',
        agility: 'dogPark.agility',
        shelter: 'dogPark.shelter',
    };

    let activeAmenities = $derived(
        park?.amenities ? amenityKeys.filter(k => park.amenities[k]) : []
    );

    let displayDescription = $derived(
        !park ? '' :
        (locale.current === 'fi' && park.descriptionFi) ? park.descriptionFi :
        (park.description || park.descriptionFi || '')
    );

    let sortedTerritories = $derived(
        [...territories].sort((a, b) => {
            const typeOrder = { municipality: 0, district: 1, sub_district: 2 };
            const diff = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
        })
    );

    // Duration options
    const durationOptions = [
        { value: 15, label: '15 min' },
        { value: 30, label: '30 min' },
        { value: 60, label: '1h' },
        { value: 90, label: '1.5h' },
        { value: 120, label: '2h' },
        { value: 180, label: '3h' },
    ];

    async function loadPark(slug) {
        park = null;
        loading = true;
        loadError = false;
        try {
            park = await getDogPark(slug);
            isFollowing = park.isFollowing || false;
            followerCount = park.followerCount || 0;
        } catch (e) {
            loadError = true;
            console.error('Failed to load dog park:', e);
            showToast(t('common.failedLoad'), 'error');
        }
        loading = false;
    }

    async function reloadPark(slug) {
        try {
            park = await getDogPark(slug);
            isFollowing = park.isFollowing || false;
            followerCount = park.followerCount || 0;
        } catch (e) {
            console.error('Failed to reload park:', e);
            showToast(t('common.failedLoad'), 'error');
        }
    }

    async function loadVisits() {
        if (!park) return;
        visitsLoading = true;
        try {
            visits = await getUpcomingParkVisits(park.id);
        } catch {
            visits = [];
        }
        visitsLoading = false;
    }

    // Follow / Unfollow
    async function handleFollow() {
        if (!authed) return;
        followLoading = true;
        try {
            if (isFollowing) {
                await unfollowDogPark(park.id);
                isFollowing = false;
                followerCount = Math.max(0, followerCount - 1);
            } else {
                await followDogPark(park.id);
                isFollowing = true;
                followerCount += 1;
            }
            bumpParkVersion();
        } catch (e) {
            console.error('Follow action failed:', e);
            showToast(t('common.error'), 'error');
        }
        followLoading = false;
    }

    // Amenity suggestions
    function openAmenitySuggest() {
        amenitySuggestForm = {};
        amenityKeys.forEach(key => {
            amenitySuggestForm[key] = park.amenities?.[key] || false;
        });
        amenitySuggestSuccess = false;
        showAmenitySuggest = true;
    }

    async function submitAmenitySuggestion() {
        amenitySuggestSubmitting = true;
        try {
            // Submit each changed amenity
            const currentAmenities = park.amenities || {};
            let submitted = 0;
            for (const key of amenityKeys) {
                if (amenitySuggestForm[key] !== (currentAmenities[key] || false)) {
                    await suggestParkAmenity(park.id, key, amenitySuggestForm[key]);
                    submitted++;
                }
            }
            if (submitted > 0) {
                amenitySuggestSuccess = true;
                setTimeout(() => {
                    showAmenitySuggest = false;
                    amenitySuggestSuccess = false;
                }, 2000);
            } else {
                showAmenitySuggest = false;
            }
        } catch (e) {
            console.error('Failed to submit amenity suggestion:', e);
            showToast(t('common.failedLoad'), 'error');
        }
        amenitySuggestSubmitting = false;
    }

    // Visit scheduling
    async function openVisitForm() {
        if (myDogs.length === 0) {
            try {
                myDogs = await getMyDogs();
            } catch {
                myDogs = [];
            }
        }
        // Default arrival: next full hour
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        visitForm = {
            dogId: myDogs.length === 1 ? myDogs[0].id : '',
            arrivalAt: localISO,
            durationMinutes: 60,
            note: '',
        };
        showVisitForm = true;
    }

    async function submitVisit() {
        visitSubmitting = true;
        try {
            const arrivalDate = new Date(visitForm.arrivalAt);
            await scheduleParkVisit(park.id, {
                dogId: visitForm.dogId,
                arrivalAt: arrivalDate.toISOString(),
                durationMinutes: visitForm.durationMinutes,
                note: visitForm.note || undefined,
            });
            showVisitForm = false;
            await loadVisits();
        } catch (e) {
            console.error('Failed to schedule visit:', e);
            showToast(t('common.failedLoad'), 'error');
        }
        visitSubmitting = false;
    }

    async function handleCancelVisit(visitId) {
        try {
            await cancelParkVisit(visitId);
            visits = visits.filter(v => v.id !== visitId);
        } catch (e) {
            console.error('Failed to cancel visit:', e);
            showToast(t('common.error'), 'error');
        }
    }

    function formatVisitTime(isoStr) {
        const d = new Date(isoStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = d.toDateString() === tomorrow.toDateString();

        const time = d.toLocaleTimeString(locale.current === 'fi' ? 'fi-FI' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
        if (isToday) return `${locale.current === 'fi' ? 'Tänään' : 'Today'} ${time}`;
        if (isTomorrow) return `${locale.current === 'fi' ? 'Huomenna' : 'Tomorrow'} ${time}`;
        const date = d.toLocaleDateString(locale.current === 'fi' ? 'fi-FI' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        return `${date} ${time}`;
    }

    function formatDuration(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m ? `${h}h ${m}min` : `${h}h`;
    }

    $effect(() => {
        const slug = params.slug;
        if (slug) {
            loadPark(slug);
        }
    });

    // Load visits once park is loaded
    $effect(() => {
        if (park?.id) loadVisits();
    });
</script>

<div class="park-page">
    {#if loading}
        <div class="park-hero">
            <div class="park-hero-gradient"></div>
        </div>
        <div class="park-sheet">
            <div class="park-container">
                <div class="skeleton skeleton-text" style="width: 60%; height: 28px; margin-bottom: 12px;"></div>
                <div class="skeleton skeleton-text" style="width: 40%; height: 16px;"></div>
            </div>
        </div>
    {:else if loadError || !park}
        <div class="park-sheet" style="margin-top: 0;">
            <div class="park-container">
                <div class="woof-empty-state">
                    <div class="woof-empty-state-icon woof-empty-state-icon--error">
                        <i class="fas fa-circle-exclamation"></i>
                    </div>
                    <p>{t('dogPark.failedLoad')}</p>
                </div>
            </div>
        </div>
    {:else}
        <!-- Hero -->
        <div class="park-hero">
            {#if park.images && park.images.length > 0}
                <img src={park.images[0].imageUrl} alt={localName(park)} class="park-hero-img" />
            {:else}
                <div class="park-hero-gradient">
                    <div class="park-hero-icon">
                        <i class="fas fa-tree"></i>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Sheet overlay -->
        <div class="park-sheet">
            <div class="park-container">
                <!-- Breadcrumb -->
                {#if park.territory}
                    <a href="/territory/{park.territory.path}" data-link class="park-breadcrumb">
                        <i class="fas fa-chevron-left"></i> {localName(park.territory)}
                    </a>
                {/if}

                <!-- Name + type + follow -->
                <div class="park-header">
                    <div class="park-header-left">
                        <h1 class="park-name">{localName(park)}</h1>
                        <span class="park-type-pill">{parkTypeLabel(park.parkType)}</span>
                    </div>
                    <div class="park-header-right">
                        {#if isAdmin && !editing}
                            <button class="park-edit-btn" onclick={startEdit} title="Edit park">
                                <i class="fas fa-pencil"></i>
                            </button>
                        {/if}
                        {#if authed}
                            <button
                                class="park-follow-btn"
                                class:following={isFollowing}
                                onclick={handleFollow}
                                disabled={followLoading}
                            >
                                {#if isFollowing}
                                    <i class="fas fa-heart"></i> {t('dogPark.followingPark')}
                                {:else}
                                    <i class="far fa-heart"></i> {t('dogPark.follow')}
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>

                <!-- Follower count -->
                {#if followerCount > 0}
                    <div class="park-follower-count">
                        {followerCount} {followerCount === 1 ? t('dogPark.follower') : t('dogPark.followers')}
                    </div>
                {/if}

                {#if editing}
                    <!-- Admin Edit Form -->
                    <div class="park-edit-form">
                        <div class="park-edit-field">
                            <label for="edit-name">Name (EN)</label>
                            <input id="edit-name" type="text" bind:value={editForm.name} />
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-name-fi">Name (FI)</label>
                            <input id="edit-name-fi" type="text" bind:value={editForm.nameFi} />
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-type">Park Type</label>
                            <select id="edit-type" bind:value={editForm.parkType}>
                                <option value="all_sizes">All sizes</option>
                                <option value="separate_areas">Separate areas</option>
                            </select>
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-territory">Territory</label>
                            <select id="edit-territory" bind:value={editForm.territoryId}>
                                <option value="">— None —</option>
                                {#each sortedTerritories as ter (ter.id)}
                                    <option value={ter.id}>{ter.name} ({ter.type})</option>
                                {/each}
                            </select>
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-address">Address</label>
                            <input id="edit-address" type="text" bind:value={editForm.address} />
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-size">Size (m²)</label>
                            <input id="edit-size" type="number" bind:value={editForm.sizeM2} placeholder="e.g. 3500" />
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-desc">Description (EN)</label>
                            <textarea id="edit-desc" rows="3" bind:value={editForm.description}></textarea>
                        </div>
                        <div class="park-edit-field">
                            <label for="edit-desc-fi">Description (FI)</label>
                            <textarea id="edit-desc-fi" rows="3" bind:value={editForm.descriptionFi}></textarea>
                        </div>

                        <div class="park-edit-field">
                            <label>Amenities</label>
                            <div class="park-edit-amenities">
                                {#each amenityKeys as key}
                                    <button
                                        type="button"
                                        class="park-edit-amenity-toggle"
                                        class:active={editForm.amenities[key]}
                                        onclick={() => toggleAmenity(key)}
                                    >
                                        <i class="fas {amenityIcons[key]}"></i>
                                        {t(amenityI18n[key])}
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <div class="park-edit-actions">
                            <button class="park-edit-save" onclick={saveEdit} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button class="park-edit-cancel" onclick={cancelEdit} disabled={saving}>
                                Cancel
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- Info rows -->
                    <div class="park-info-rows">
                        {#if park.address}
                            <div class="park-info-row">
                                <i class="fas fa-location-dot"></i>
                                <span>{park.address}</span>
                            </div>
                        {/if}
                        {#if park.sizeM2}
                            <div class="park-info-row">
                                <i class="fas fa-ruler-combined"></i>
                                <span>{t('dogPark.sizeM2')}: {park.sizeM2.toLocaleString()} m²</span>
                            </div>
                        {/if}
                        {#if park.latitude && park.longitude}
                            <div class="park-info-row park-info-coords">
                                <i class="fas fa-compass"></i>
                                <span>{park.latitude.toFixed(5)}, {park.longitude.toFixed(5)}</span>
                            </div>
                        {/if}
                    </div>

                    <!-- Description -->
                    {#if displayDescription}
                        <div class="park-description">
                            <p>{displayDescription}</p>
                        </div>
                    {/if}

                    <!-- Amenities -->
                    <div class="park-section">
                        <h2 class="park-section-title">{t('dogPark.amenities')}</h2>
                        <div class="park-amenities-grid">
                            {#if park.parkType === 'separate_areas'}
                                <div class="park-amenity">
                                    <div class="park-amenity-icon">
                                        <i class="fas fa-dog"></i>
                                    </div>
                                    <span class="park-amenity-label">{t('dogPark.smallDogArea')}</span>
                                </div>
                                <div class="park-amenity">
                                    <div class="park-amenity-icon">
                                        <i class="fas fa-dog"></i>
                                    </div>
                                    <span class="park-amenity-label">{t('dogPark.largeDogArea')}</span>
                                </div>
                            {:else}
                                <div class="park-amenity">
                                    <div class="park-amenity-icon">
                                        <i class="fas fa-paw"></i>
                                    </div>
                                    <span class="park-amenity-label">{t('dogPark.allSizesDesc')}</span>
                                </div>
                            {/if}
                            {#each activeAmenities as key}
                                <div class="park-amenity">
                                    <div class="park-amenity-icon">
                                        <i class="fas {amenityIcons[key]}"></i>
                                    </div>
                                    <span class="park-amenity-label">{t(amenityI18n[key])}</span>
                                </div>
                            {/each}
                        </div>
                        {#if authed && !showAmenitySuggest}
                            <button class="park-suggest-edit-btn" onclick={openAmenitySuggest}>
                                <i class="fas fa-pen-to-square"></i> {t('dogPark.suggestEdit')}
                            </button>
                        {/if}
                        {#if showAmenitySuggest}
                            <div class="park-amenity-suggest-form">
                                {#if amenitySuggestSuccess}
                                    <div class="park-suggest-success">
                                        <i class="fas fa-circle-check"></i> {t('dogPark.suggestionSent')}
                                    </div>
                                {:else}
                                    <div class="park-edit-amenities">
                                        {#each amenityKeys as key}
                                            <button
                                                type="button"
                                                class="park-edit-amenity-toggle"
                                                class:active={amenitySuggestForm[key]}
                                                onclick={() => { amenitySuggestForm[key] = !amenitySuggestForm[key]; amenitySuggestForm = { ...amenitySuggestForm }; }}
                                            >
                                                <i class="fas {amenityIcons[key]}"></i>
                                                {t(amenityI18n[key])}
                                            </button>
                                        {/each}
                                    </div>
                                    <div class="park-edit-actions">
                                        <button class="park-edit-save" onclick={submitAmenitySuggestion} disabled={amenitySuggestSubmitting}>
                                            {amenitySuggestSubmitting ? '...' : t('common.save')}
                                        </button>
                                        <button class="park-edit-cancel" onclick={() => { showAmenitySuggest = false; }}>
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <!-- Upcoming Visits -->
                    <div class="park-section">
                        <h2 class="park-section-title">{t('dogPark.upcomingVisits')}</h2>
                        {#if visits.length > 0}
                            <div class="park-visits-list">
                                {#each visits as visit (visit.id)}
                                    <div class="park-visit-row">
                                        <a href="/dog/{visit.dog.slug}" data-link class="park-visit-dog">
                                            <img
                                                src={visit.dog.profilePhoto || '/images/dog_profile_pic.jpg'}
                                                alt={visit.dog.name}
                                                class="park-visit-dog-photo"
                                                onerror={(e) => { e.target.src = '/images/dog_profile_pic.jpg'; }}
                                            />
                                            <span class="park-visit-dog-name">{visit.dog.name}</span>
                                        </a>
                                        <div class="park-visit-info">
                                            <span class="park-visit-time">{formatVisitTime(visit.arrivalAt)}</span>
                                            <span class="park-visit-duration">~{formatDuration(visit.durationMinutes)}</span>
                                        </div>
                                        {#if visit.note}
                                            <div class="park-visit-note">{visit.note}</div>
                                        {/if}
                                        {#if visit.isMine}
                                            <button class="park-visit-cancel" onclick={() => handleCancelVisit(visit.id)}>
                                                <i class="fas fa-times"></i>
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {:else if !visitsLoading}
                            <p class="park-no-visits">{t('dogPark.noUpcomingVisits')}</p>
                        {/if}

                        {#if authed && isFollowing && !showVisitForm}
                            <button class="park-schedule-btn" onclick={openVisitForm}>
                                <i class="fas fa-calendar-plus"></i> {t('dogPark.scheduleVisit')}
                            </button>
                        {:else if authed && !isFollowing && !showVisitForm}
                            <p class="park-follow-hint">{t('dogPark.followToSchedule')}</p>
                        {:else if !authed}
                            <p class="park-follow-hint">{t('dogPark.loginToFollow')}</p>
                        {/if}

                        {#if showVisitForm}
                            <div class="park-visit-form">
                                {#if myDogs.length > 1}
                                    <div class="park-edit-field">
                                        <label for="visit-dog">{t('dogPark.selectDog')}</label>
                                        <select id="visit-dog" bind:value={visitForm.dogId}>
                                            <option value="">--</option>
                                            {#each myDogs as dog (dog.id)}
                                                <option value={dog.id}>{dog.name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                {/if}
                                <div class="park-edit-field">
                                    <label for="visit-time">{t('dogPark.arrivalTime')}</label>
                                    <input id="visit-time" type="datetime-local" bind:value={visitForm.arrivalAt} />
                                </div>
                                <div class="park-edit-field">
                                    <label for="visit-duration">{t('dogPark.duration')}</label>
                                    <select id="visit-duration" bind:value={visitForm.durationMinutes}>
                                        {#each durationOptions as opt}
                                            <option value={opt.value}>{opt.label}</option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="park-edit-field">
                                    <label for="visit-note">{t('dogPark.visitNote')}</label>
                                    <input id="visit-note" type="text" bind:value={visitForm.note} maxlength="500" />
                                </div>
                                <div class="park-edit-actions">
                                    <button class="park-edit-save" onclick={submitVisit} disabled={visitSubmitting || !visitForm.dogId || !visitForm.arrivalAt}>
                                        {visitSubmitting ? '...' : t('dogPark.scheduleVisit')}
                                    </button>
                                    <button class="park-edit-cancel" onclick={() => { showVisitForm = false; }}>
                                        {t('common.cancel')}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Photos -->
                {#if park.images && park.images.length > 0}
                    <div class="park-section">
                        <h2 class="park-section-title">{t('dogPark.photos')}</h2>
                        <div class="park-photos-grid">
                            {#each park.images as img (img.id)}
                                <div class="park-photo">
                                    <img src={img.imageUrl} alt={img.caption || ''} loading="lazy" />
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="park-photos-empty">
                        <i class="fas fa-camera"></i>
                        <span>{t('dogPark.noPhotosYet')}</span>
                    </div>
                {/if}

                <!-- Attribution -->
                {#if park.source === 'osm'}
                    <div class="park-attribution">
                        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">
                            {t('dogPark.osmAttribution')}
                        </a>
                    </div>
                {:else if park.source === 'municipal'}
                    <div class="park-attribution">
                        {t('dogPark.municipalAttribution')}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
.park-page {
    margin: -20px;
    min-height: 100vh;
}

/* Hero */
.park-hero {
    width: 100%;
    height: 28vh;
    min-height: 140px;
    max-height: 240px;
    overflow: hidden;
    position: relative;
}

.park-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.park-hero-gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--woof-color-fresh-mint) 0%, var(--woof-color-fresh-mint-dark) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.park-hero-icon {
    width: 72px;
    height: 72px;
    border-radius: var(--woof-radius-full);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: rgba(255, 255, 255, 0.8);
}

/* Sheet */
.park-sheet {
    background: var(--woof-surface-primary);
    border-radius: var(--woof-radius-2xl) var(--woof-radius-2xl) 0 0;
    margin-top: -28px;
    position: relative;
    z-index: 1;
    padding: var(--woof-space-5) var(--woof-space-5) var(--woof-space-10);
    min-height: 60vh;
    width: 100%;
    box-sizing: border-box;
}

.park-container {
    max-width: 640px;
    margin: 0 auto;
}

/* Breadcrumb */
.park-breadcrumb {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    color: var(--woof-color-brand-primary);
    text-decoration: none;
    font-size: var(--woof-text-footnote);
    margin-bottom: var(--woof-space-2);
}

.park-breadcrumb:hover {
    text-decoration: underline;
}

.park-breadcrumb i {
    font-size: 10px;
}

/* Header */
.park-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-2);
}

.park-header-left {
    display: flex;
    align-items: baseline;
    gap: var(--woof-space-3);
    flex-wrap: wrap;
    min-width: 0;
}

.park-header-right {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    flex-shrink: 0;
}

.park-name {
    font-size: var(--woof-text-title-1);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    margin: 0;
    line-height: 1.15;
    letter-spacing: -0.5px;
}

.park-type-pill {
    display: inline-block;
    padding: 2px var(--woof-space-3);
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-fresh-mint-light);
    color: var(--woof-color-fresh-mint-dark);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    white-space: nowrap;
}

/* Follow button */
.park-follow-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-2) var(--woof-space-4);
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid var(--woof-color-brand-primary);
    background: var(--woof-color-brand-primary);
    color: white;
    white-space: nowrap;
}

.park-follow-btn:hover {
    opacity: 0.9;
}

.park-follow-btn.following {
    background: transparent;
    color: var(--woof-color-brand-primary);
}

.park-follow-btn:disabled {
    opacity: 0.5;
    cursor: default;
}

.park-follower-count {
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-500);
    margin-bottom: var(--woof-space-3);
}

/* Info rows */
.park-info-rows {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-4);
    padding-bottom: var(--woof-space-4);
    border-bottom: 1px solid var(--woof-color-neutral-100);
}

.park-info-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-600);
}

.park-info-row i {
    width: 18px;
    text-align: center;
    color: var(--woof-color-neutral-400);
    font-size: 14px;
    flex-shrink: 0;
}

.park-info-coords span {
    font-family: var(--woof-font-family-mono);
    font-size: var(--woof-text-footnote);
}

/* Description */
.park-description {
    margin-bottom: var(--woof-space-4);
    color: var(--woof-color-neutral-700);
    line-height: 1.6;
    font-size: var(--woof-text-body);
}

.park-description p {
    margin: 0;
}

/* Sections */
.park-section {
    margin-bottom: var(--woof-space-5);
}

.park-section-title {
    font-size: var(--woof-text-subheadline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-800);
    margin: 0 0 var(--woof-space-3);
}

/* Amenities */
.park-amenities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: var(--woof-space-3);
}

.park-amenity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-3);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-lg);
    text-align: center;
}

.park-amenity-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-fresh-mint-light);
    color: var(--woof-color-fresh-mint-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
}

.park-amenity-label {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-700);
    font-weight: var(--woof-font-weight-medium);
}

/* Suggest edit button */
.park-suggest-edit-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    margin-top: var(--woof-space-3);
    padding: 0;
    background: none;
    border: none;
    color: var(--woof-color-brand-primary);
    font-size: var(--woof-text-caption-1);
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
}

.park-suggest-edit-btn:hover {
    opacity: 0.7;
}

/* Amenity suggestion form */
.park-amenity-suggest-form {
    margin-top: var(--woof-space-3);
    padding: var(--woof-space-4);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-lg);
}

.park-suggest-success {
    color: var(--woof-color-fresh-mint-dark);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
}

/* Visits */
.park-visits-list {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-3);
}

.park-visit-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-lg);
    position: relative;
    flex-wrap: wrap;
}

.park-visit-dog {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    text-decoration: none;
    color: var(--woof-color-neutral-900);
    flex-shrink: 0;
}

.park-visit-dog-photo {
    width: 32px;
    height: 32px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
}

.park-visit-dog-name {
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-body);
}

.park-visit-info {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    flex: 1;
    min-width: 0;
}

.park-visit-time {
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-700);
}

.park-visit-duration {
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
}

.park-visit-note {
    width: 100%;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-500);
    font-style: italic;
    padding-left: 44px;
}

.park-visit-cancel {
    position: absolute;
    top: var(--woof-space-2);
    right: var(--woof-space-2);
    background: none;
    border: none;
    color: var(--woof-color-neutral-400);
    cursor: pointer;
    padding: var(--woof-space-1);
    font-size: 12px;
    line-height: 1;
    transition: color 0.15s;
}

.park-visit-cancel:hover {
    color: var(--woof-color-brand-primary);
}

.park-no-visits {
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
    margin: 0 0 var(--woof-space-3);
}

.park-schedule-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-4);
    border: 1px solid var(--woof-color-fresh-mint);
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-fresh-mint-light);
    color: var(--woof-color-fresh-mint-dark);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
}

.park-schedule-btn:hover {
    background: var(--woof-color-fresh-mint);
    color: white;
}

.park-follow-hint {
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-caption-1);
    margin: 0;
}

.park-visit-form {
    margin-top: var(--woof-space-3);
    padding: var(--woof-space-4);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-lg);
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
}

/* Photos */
.park-photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--woof-space-2);
}

.park-photo img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--woof-radius-md);
}

.park-photos-empty {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-4);
    border: 2px dashed var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-footnote);
    margin-bottom: var(--woof-space-5);
}

.park-photos-empty i {
    font-size: 18px;
}

/* Attribution */
.park-attribution {
    text-align: center;
    padding: var(--woof-space-4) 0;
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-400);
}

.park-attribution a {
    color: var(--woof-color-neutral-400);
    text-decoration: none;
}

.park-attribution a:hover {
    text-decoration: underline;
}

/* Admin edit button */
.park-edit-btn {
    background: none;
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--woof-color-neutral-500);
    font-size: 13px;
    flex-shrink: 0;
    transition: all 0.15s;
}

.park-edit-btn:hover {
    background: var(--woof-color-neutral-50);
    color: var(--woof-color-neutral-700);
    border-color: var(--woof-color-neutral-300);
}

/* Edit form */
.park-edit-form {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-4);
    margin-bottom: var(--woof-space-5);
    padding: var(--woof-space-4);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-lg);
}

.park-edit-field {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
}

.park-edit-field label {
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-600);
}

.park-edit-field input,
.park-edit-field select,
.park-edit-field textarea {
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    color: var(--woof-color-neutral-900);
    background: var(--woof-surface-primary);
    font-family: inherit;
    box-sizing: border-box;
    width: 100%;
}

.park-edit-field input:focus,
.park-edit-field select:focus,
.park-edit-field textarea:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
    box-shadow: 0 0 0 2px var(--woof-color-brand-primary-subtle);
}

.park-edit-amenities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--woof-space-2);
}

.park-edit-amenity-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-1) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-500);
    font-size: var(--woof-text-caption-1);
    cursor: pointer;
    transition: all 0.15s;
}

.park-edit-amenity-toggle:hover {
    border-color: var(--woof-color-neutral-300);
}

.park-edit-amenity-toggle.active {
    background: var(--woof-color-fresh-mint-light);
    border-color: var(--woof-color-fresh-mint);
    color: var(--woof-color-fresh-mint-dark);
}

.park-edit-actions {
    display: flex;
    gap: var(--woof-space-3);
    padding-top: var(--woof-space-2);
}

.park-edit-save {
    padding: var(--woof-space-2) var(--woof-space-5);
    border: none;
    border-radius: var(--woof-radius-md);
    background: var(--woof-color-brand-primary);
    color: white;
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    transition: opacity 0.15s;
}

.park-edit-save:hover {
    opacity: 0.9;
}

.park-edit-save:disabled {
    opacity: 0.5;
    cursor: default;
}

.park-edit-cancel {
    padding: var(--woof-space-2) var(--woof-space-5);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-600);
    font-size: var(--woof-text-body);
    cursor: pointer;
    transition: background 0.15s;
}

.park-edit-cancel:hover {
    background: var(--woof-color-neutral-50);
}

.park-edit-cancel:disabled {
    opacity: 0.5;
    cursor: default;
}

@media (max-width: 768px) {
    .park-page {
        margin: -20px 0 0;
    }
}
</style>
