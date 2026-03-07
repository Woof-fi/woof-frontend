export function validateAndPreview(file: File, maxSizeMB?: number): { file: File; previewUrl: string } | null;
export function revokePreview(previewUrl: string | null): void;
