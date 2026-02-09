/**
 * Internationalization (i18n) Module
 * Supports English and Finnish
 */

const translations = {
    en: {
        // Navigation
        home: 'Home',
        create: 'Create',
        map: 'Map',
        profile: 'Profile',
        myDogs: 'My Dogs',
        messages: 'Messages',
        notifications: 'Notifications',
        search: 'Search',

        // Auth
        login: 'Login',
        logout: 'Logout',
        register: 'Sign up',
        email: 'Email',
        password: 'Password',
        name: 'Your name',

        // Feed
        following: 'Following',
        forYou: 'For you',
        noPosts: 'No posts yet. Be the first to share!',

        // Posts
        createPost: 'Create New Post',
        uploadImage: 'Upload image',
        writeCaption: 'Write a caption...',
        post: 'Post',

        // Actions
        like: 'Like',
        comment: 'Comment',
        share: 'Share',

        // Messages
        pleaseLogin: 'Please login to {{action}}',
        loginToCreatePost: 'Please login to create a post',
        loginToLike: 'Please login to like posts',
        uploadingImage: 'Uploading image...',
        postCreated: 'Post created successfully!',
        loggedOut: 'Logged out successfully',
        welcomeToWoof: 'Welcome to Woof',

        // Errors
        failedToLoad: 'Failed to load {{item}}',
        tryAgain: 'Please try again'
    },
    fi: {
        // Navigation
        home: 'Koti',
        create: 'Luo',
        map: 'Kartta',
        profile: 'Profiili',
        myDogs: 'Koirani',
        messages: 'Viestit',
        notifications: 'Ilmoitukset',
        search: 'Hae',

        // Auth
        login: 'Kirjaudu',
        logout: 'Kirjaudu ulos',
        register: 'Rekisteröidy',
        email: 'Sähköposti',
        password: 'Salasana',
        name: 'Nimesi',

        // Feed
        following: 'Seurattavat',
        forYou: 'Sinulle',
        noPosts: 'Ei vielä julkaisuja. Ole ensimmäinen!',

        // Posts
        createPost: 'Luo uusi julkaisu',
        uploadImage: 'Lataa kuva',
        writeCaption: 'Kirjoita kuvateksti...',
        post: 'Julkaise',

        // Actions
        like: 'Tykkää',
        comment: 'Kommentoi',
        share: 'Jaa',

        // Messages
        pleaseLogin: 'Kirjaudu {{action}}',
        loginToCreatePost: 'Kirjaudu luodaksesi julkaisun',
        loginToLike: 'Kirjaudu tykätäksesi',
        uploadingImage: 'Ladataan kuvaa...',
        postCreated: 'Julkaisu luotu!',
        loggedOut: 'Kirjauduit ulos',
        welcomeToWoof: 'Tervetuloa Woofiin',

        // Errors
        failedToLoad: '{{item}} lataus epäonnistui',
        tryAgain: 'Yritä uudelleen'
    }
};

// Current language (default: English)
let currentLanguage = 'en';

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
    // Check localStorage first
    const stored = localStorage.getItem('woof_language');
    if (stored && translations[stored]) {
        currentLanguage = stored;
    }
    return currentLanguage;
}

/**
 * Set language
 * @param {string} lang - Language code ('en' or 'fi')
 */
export function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language '${lang}' not supported, using English`);
        lang = 'en';
    }

    currentLanguage = lang;
    localStorage.setItem('woof_language', lang);

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Trigger custom event for language change
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
}

/**
 * Translate a key
 * @param {string} key - Translation key
 * @param {object} params - Parameters for interpolation
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
    const lang = getCurrentLanguage();
    let translation = translations[lang][key] || translations.en[key] || key;

    // Simple parameter interpolation
    Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
    });

    return translation;
}

/**
 * Initialize i18n
 */
export function initI18n() {
    const lang = getCurrentLanguage();
    document.documentElement.lang = lang;
}

// Auto-initialize
initI18n();
