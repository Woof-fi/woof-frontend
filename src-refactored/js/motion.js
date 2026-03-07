/**
 * Respects prefers-reduced-motion for Svelte transitions.
 * Usage: transition:fade={reduceMotion({ duration: 200 })}
 */
export function reduceMotion(options = {}) {
    const prefersReduced = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        return { ...options, duration: 0 };
    }
    return options;
}
