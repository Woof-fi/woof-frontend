import { isValidFileType, isValidFileSize } from './utils.js';
import { showToast } from './utils.js';
import { t } from './i18n-store.svelte.js';

/**
 * Validate a single file (type + size) with toast feedback.
 * Returns { file, previewUrl } or null if invalid.
 */
export function validateAndPreview(file, maxSizeMB = 10) {
    if (!isValidFileType(file)) {
        showToast(t('postCreate.invalidFileType'), 'error');
        return null;
    }
    if (!isValidFileSize(file, maxSizeMB)) {
        showToast(t('postCreate.fileTooLarge'), 'error');
        return null;
    }
    return { file, previewUrl: URL.createObjectURL(file) };
}

/**
 * Revoke a preview URL to free memory.
 */
export function revokePreview(previewUrl) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
}
