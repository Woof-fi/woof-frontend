/**
 * Svelte 5 State Store
 *
 * Svelte-rune equivalent of store.js.
 * Svelte components import from here; vanilla JS modules continue using store.js
 * until they are replaced. Both coexist — delete store.js only after every
 * import of it is gone.
 */

let authUser = $state(null);
let unreadCount = $state(0);
let currentDog = $state(null);

export const getAuthUser = () => authUser;
export const getUnreadCount = () => unreadCount;
export const getCurrentDog = () => currentDog;

export const setAuthUser = (user) => { authUser = user; };
export const setUnreadCount = (count) => { unreadCount = count; };
export const setCurrentDog = (dog) => { currentDog = dog; };

export const getState = () => ({ authUser, unreadCount, currentDog });
