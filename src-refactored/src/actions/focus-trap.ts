const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Check visibility without forcing layout reflow (avoids offsetParent) */
function isVisible(el: HTMLElement): boolean {
    if (el.hidden) return false;
    const style = el.style;
    return style.display !== 'none' && style.visibility !== 'hidden';
}

export function focusTrap(node: HTMLElement) {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the trap on mount (WCAG 2.4.3)
    // Use rAF to wait for paint instead of setTimeout — avoids forced reflow
    const rafId = requestAnimationFrame(() => {
        const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
            .filter(isVisible);
        if (focusable.length > 0) {
            focusable[0]!.focus();
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key !== 'Tab') return;

        const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
            .filter(isVisible);
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    }

    node.addEventListener('keydown', handleKeydown);
    return {
        destroy: () => {
            cancelAnimationFrame(rafId);
            node.removeEventListener('keydown', handleKeydown);
            previouslyFocused?.focus();
        }
    };
}
