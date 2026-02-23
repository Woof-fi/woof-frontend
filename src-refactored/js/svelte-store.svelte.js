/**
 * Svelte 5 State Store
 *
 * Svelte-rune equivalent of store.js.
 * Svelte components import from here; vanilla JS modules continue using store.js
 * until they are replaced. Both coexist — delete store.js only after every
 * import of it is gone.
 *
 * Note: exported $state cannot be reassigned — use a single reactive object
 * whose properties are mutated, per Svelte 5 module export rules.
 * Consumers can read store.authUser, store.dogVersion, etc. reactively.
 */
import { isAuthenticated } from './auth.js';

export let store = $state({
    // Auth — initialized synchronously so Navigation renders correctly on first paint
    authUser: isAuthenticated() ? { authenticated: true } : null,
    unreadCount: 0,
    currentDog: null,
    // Version signals — bumped after mutations to trigger re-fetch in watchers
    dogVersion: 0,
    feedVersion: 0,
    profileVersion: 0,
    healthVersion: 0,
});

// Backward-compatible function API (used by existing callers)
export const getAuthUser = () => store.authUser;
export const getUnreadCount = () => store.unreadCount;
export const getCurrentDog = () => store.currentDog;
export const getState = () => store;

export const setAuthUser = (user) => { store.authUser = user; };
export const setUnreadCount = (count) => { store.unreadCount = count; };
export const setCurrentDog = (dog) => { store.currentDog = dog; };

// Version bumpers — call after successful mutations to signal consumers
export function bumpDogVersion() { store.dogVersion++; }
export function bumpFeedVersion() { store.feedVersion++; }
export function bumpProfileVersion() { store.profileVersion++; }
export function bumpHealthVersion() { store.healthVersion++; }
