<script>
    import { getDogPark, updateAdminDogPark, getAllTerritories, followDogPark, unfollowDogPark, suggestParkAmenity, cancelParkVisit, getUpcomingParkVisits, getMyDogs, getActiveCheckins, uploadImage, uploadParkPhoto } from '../../js/api.js';
    import { t, localName, locale } from '../../js/i18n-store.svelte.js';
    import { store, bumpParkVersion } from '../../js/svelte-store.svelte.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { showToast } from '../../js/utils.js';
    import { validateAndPreview, revokePreview } from '../../js/file-handler.js';
    import ActiveVisitors from '../components/ActiveVisitors.svelte';
    import ParkActionBar from '../components/ParkActionBar.svelte';
    import PostImageCarousel from '../components/PostImageCarousel.svelte';

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
    let myDogs = $state([]);
    let requestScheduleOpen = $state(false);

    // Check-in state
    let activeCheckins = $state([]);
    let checkinsLoading = $state(true);

    // Amenity suggestion state
    let showAmenitySuggest = $state(false);
    let amenitySuggestForm = $state({});
    let amenitySuggestSubmitting = $state(false);
    let amenitySuggestSuccess = $state(false);

    // Photo upload state
    let photoUploading = $state(false);
    let photoPreview = $state(null);
    let photoFile = $state(null);
    let photoCaption = $state('');

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

    async function loadActiveCheckins() {
        if (!park) return;
        checkinsLoading = true;
        try {
            activeCheckins = await getActiveCheckins(park.id);
        } catch {
            activeCheckins = [];
        }
        checkinsLoading = false;
    }

    async function handleCheckinRefresh() {
        await loadActiveCheckins();
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
            // Handle stale state: if already following/not following, sync state
            const msg = e?.data?.error || e?.message || '';
            if (/already following/i.test(msg)) {
                isFollowing = true;
            } else if (/not following/i.test(msg)) {
                isFollowing = false;
            } else {
                console.error('Follow action failed:', e);
                showToast(t('common.error'), 'error');
            }
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

    // Photo upload handlers
    function handlePhotoSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = validateAndPreview(file, 10);
        if (!result) return;
        photoFile = result.file;
        photoPreview = result.previewUrl;
        photoCaption = '';
        e.target.value = '';
    }

    async function handlePhotoUpload() {
        if (!photoFile || !park?.id) return;
        photoUploading = true;
        try {
            const publicUrl = await uploadImage(photoFile, 'parks');
            await uploadParkPhoto(park.id, publicUrl, photoCaption.trim());
            cancelPhotoUpload();
            await reloadPark(params.slug);
            showToast(t('dogPark.photoUploaded'), 'success');
        } catch (err) {
            showToast(t('dogPark.photoUploadFailed'), 'error');
        }
        photoUploading = false;
    }

    function cancelPhotoUpload() {
        revokePreview(photoPreview);
        photoPreview = null;
        photoFile = null;
        photoCaption = '';
    }

    $effect(() => {
        const slug = params.slug;
        if (slug) {
            loadPark(slug);
        }
    });

    // Load visits and active checkins once park is loaded
    $effect(() => {
        if (park?.id) {
            loadVisits();
            loadActiveCheckins();
        }
    });

    // Load user's dogs when authed (needed for check-in and visits)
    let dogsLoaded = $state(false);
    $effect(() => {
        if (authed && park?.id && !dogsLoaded) {
            dogsLoaded = true;
            getMyDogs().then(dogs => { myDogs = dogs; }).catch(() => { myDogs = []; });
        }
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
            {#if park.images && park.images.length > 1}
                <PostImageCarousel
                    imageUrls={park.images.map(img => img.imageUrl)}
                    username={localName(park)}
                />
            {:else if park.images && park.images.length === 1}
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
                    {#if isAdmin && !editing}
                        <button class="park-edit-btn" onclick={startEdit} title="Edit park">
                            <i class="fas fa-pencil"></i>
                        </button>
                    {/if}
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
                            <span class="park-edit-label">Amenities</span>
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

                    <!-- Active Check-ins -->
                    <div class="park-section">
                        <ActiveVisitors checkins={activeCheckins} loading={checkinsLoading} />
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
                                            <button class="park-visit-cancel" aria-label="Cancel visit" onclick={() => handleCancelVisit(visit.id)}>
                                                <i class="fas fa-times"></i>
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {:else if !visitsLoading}
                            <p class="park-no-visits">{t('dogPark.noUpcomingVisits')}</p>
                        {/if}

                        {#if authed && isFollowing}
                            <button class="park-schedule-btn" onclick={() => { requestScheduleOpen = true; }}>
                                <i class="fas fa-calendar-plus"></i> {t('dogPark.scheduleVisit')}
                            </button>
                        {:else if authed && !isFollowing}
                            <p class="park-follow-hint">{t('dogPark.followToSchedule')}</p>
                        {:else if !authed}
                            <p class="park-follow-hint">{t('dogPark.loginToFollow')}</p>
                        {/if}
                    </div>
                {/if}

                <!-- Photos -->
                <div class="park-section">
                    <div class="park-section-header">
                        <h2 class="park-section-title">{t('dogPark.photos')}</h2>
                        {#if authed}
                            <label class="park-photo-add-btn">
                                <span class="btn-content"><i class="fas fa-camera"></i></span> {t('dogPark.addPhoto')}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    class="sr-only"
                                    onchange={handlePhotoSelect}
                                />
                            </label>
                        {/if}
                    </div>

                    {#if photoPreview}
                        <div class="park-photo-upload-preview">
                            <img src={photoPreview} alt="Preview" class="park-photo-preview-img" />
                            <input
                                type="text"
                                class="park-photo-caption-input"
                                bind:value={photoCaption}
                                placeholder={t('dogPark.photoCaption')}
                                maxlength="500"
                            />
                            <div class="park-photo-upload-actions">
                                <button class="park-photo-upload-btn" onclick={handlePhotoUpload} disabled={photoUploading}>
                                    {#if photoUploading}
                                        <span class="btn-content"><span class="woof-spinner"></span> {t('dogPark.uploadPhoto')}</span>
                                    {:else}
                                        <span class="btn-content"><i class="fas fa-cloud-arrow-up"></i> {t('dogPark.uploadPhoto')}</span>
                                    {/if}
                                </button>
                                <button class="park-photo-cancel-btn" onclick={cancelPhotoUpload} disabled={photoUploading}>
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </div>
                    {/if}

                    {#if park.images && park.images.length > 0}
                        <div class="park-photos-grid">
                            {#each park.images as img (img.id)}
                                <div class="park-photo">
                                    <img src={img.imageUrl} alt={img.caption || localName(park)} loading="lazy" />
                                </div>
                            {/each}
                        </div>
                    {:else if !photoPreview}
                        <div class="park-photos-empty">
                            <i class="fas fa-camera"></i>
                            <span>{t('dogPark.noPhotosYet')}</span>
                        </div>
                    {/if}
                </div>

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
        <ParkActionBar
            parkId={park.id}
            {myDogs}
            {activeCheckins}
            {isFollowing}
            {followLoading}
            onFollowToggle={handleFollow}
            onCheckin={handleCheckinRefresh}
            onCheckout={handleCheckinRefresh}
            onVisitScheduled={loadVisits}
            {requestScheduleOpen}
            onScheduleHandled={() => { requestScheduleOpen = false; }}
        />
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
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--woof-space-2) var(--woof-space-3);
    margin-bottom: var(--woof-space-2);
}

.park-header-left {
    display: flex;
    align-items: baseline;
    gap: var(--woof-space-3);
    flex-wrap: wrap;
    min-width: 0;
    flex: 1 1 100%;
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

/* Photo upload */
.park-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--woof-space-3);
}

.park-section-header .park-section-title {
    margin-bottom: 0;
}

.park-photo-add-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-1) var(--woof-space-3);
    border: 1.5px solid var(--woof-color-brand-primary);
    background: none;
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-brand-primary);
    cursor: pointer;
    transition: all var(--woof-duration-fast);
}

.park-photo-add-btn:hover {
    background: var(--woof-color-brand-primary-subtle);
}

.park-photo-upload-preview {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-3);
    padding: var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    background: var(--woof-surface-secondary);
}

.park-photo-preview-img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: var(--woof-radius-md);
}

.park-photo-caption-input {
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: inherit;
    color: var(--woof-color-neutral-900);
    background: var(--woof-surface-primary);
    box-sizing: border-box;
}

.park-photo-caption-input:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
}

.park-photo-caption-input::placeholder {
    color: var(--woof-color-neutral-400);
}

.park-photo-upload-actions {
    display: flex;
    gap: var(--woof-space-2);
}

.park-photo-upload-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-3);
    background: var(--woof-color-brand-primary);
    color: var(--woof-color-neutral-0);
    border: none;
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
}

.park-photo-upload-btn:hover {
    background: var(--woof-color-brand-primary-dark);
}

.park-photo-upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.park-photo-cancel-btn {
    padding: var(--woof-space-2) var(--woof-space-3);
    background: none;
    color: var(--woof-color-neutral-600);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-body);
    font-family: inherit;
    cursor: pointer;
}

.park-photo-cancel-btn:hover {
    background: var(--woof-color-neutral-100);
}

.park-photo-cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Screen-reader only (hides file input) */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Hero carousel overrides */
.park-hero :global(.carousel) {
    height: 100%;
    max-height: 240px;
}

.park-hero :global(.carousel-slide img) {
    object-fit: cover;
    height: 100%;
    max-height: 240px;
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

.park-edit-field label,
.park-edit-label {
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
