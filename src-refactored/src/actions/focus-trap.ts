const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusTrap(node: HTMLElement) {
    function handleKeydown(e: KeyboardEvent) {
        if (e.key !== 'Tab') return;

        const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
            .filter(el => el.offsetParent !== null);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    }

    node.addEventListener('keydown', handleKeydown);
    return { destroy: () => node.removeEventListener('keydown', handleKeydown) };
}
