export function viewport(node: HTMLElement, callback: () => void) {
    const observer = new IntersectionObserver(
        (entries) => { if (entries[0]?.isIntersecting) callback(); },
        { rootMargin: '200px' }
    );
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
}
