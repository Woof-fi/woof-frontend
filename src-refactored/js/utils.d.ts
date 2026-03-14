export function escapeHTML(text: string): string;
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void;
export function timeAgo(date: Date | string): string;
export function showToast(message: string, type?: 'success' | 'error' | 'info'): void;
export function isValidFileType(file: File, allowedTypes?: string[]): boolean;
export function isValidFileSize(file: File, maxSizeMB?: number): boolean;
export function imageVariant(url: string, variant: 'medium' | 'thumb'): string;
