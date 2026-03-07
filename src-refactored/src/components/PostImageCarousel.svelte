<script>
    import { imageVariant } from '../../js/utils.js';

    let {
        imageUrls = [],
        username = '',
        ondoubletap = null,
    } = $props();

    const FALLBACK_POST = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23cccccc" width="400" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';

    let current = $state(0);
    let touchStartX = $state(0);
    let touchDeltaX = $state(0);
    let swiping = $state(false);
    let containerEl = $state(null);

    const count = $derived(imageUrls.length);

    function goTo(index) {
        current = Math.max(0, Math.min(index, count - 1));
    }

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchDeltaX = 0;
        swiping = true;
    }

    function handleTouchMove(e) {
        if (!swiping) return;
        touchDeltaX = e.touches[0].clientX - touchStartX;
        // Stop horizontal swipes from triggering pull-to-refresh
        if (Math.abs(touchDeltaX) > 10) {
            e.stopPropagation();
        }
    }

    function handleTouchEnd() {
        if (!swiping) return;
        swiping = false;
        const threshold = 50;
        if (touchDeltaX < -threshold && current < count - 1) {
            current++;
        } else if (touchDeltaX > threshold && current > 0) {
            current--;
        }
        touchDeltaX = 0;
    }

    // Double-tap detection
    let lastTapTime = 0;
    function handleTap() {
        const now = Date.now();
        if (now - lastTapTime < 300) {
            ondoubletap?.();
            lastTapTime = 0;
        } else {
            lastTapTime = now;
        }
    }

    const translateX = $derived.by(() => {
        const drag = swiping ? touchDeltaX : 0;
        return `translateX(calc(-${current * 100}% + ${drag}px))`;
    });

    const canGoPrev = $derived(current > 0);
    const canGoNext = $derived(current < count - 1);

    function goPrev(e) {
        e.stopPropagation();
        if (canGoPrev) current--;
    }

    function goNext(e) {
        e.stopPropagation();
        if (canGoNext) current++;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="carousel"
    bind:this={containerEl}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    onclick={handleTap}
>
    <div
        class="carousel-track"
        class:swiping
        style="transform: {translateX}"
    >
        {#each imageUrls as url, i (i)}
            <div class="carousel-slide">
                <img
                    src={url}
                    srcset="{imageVariant(url, 'medium')} 600w, {url} 1200w"
                    sizes="(max-width: 540px) 100vw, 500px"
                    alt="Post by {username} ({i + 1} of {count})"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onerror={(e) => {
                        if (e.target.srcset) {
                            e.target.srcset = '';
                            e.target.src = url;
                        } else if (e.target.src !== FALLBACK_POST) {
                            e.target.src = FALLBACK_POST;
                        }
                    }}
                />
            </div>
        {/each}
    </div>

    {#if count > 1}
        {#if canGoPrev}
            <button
                class="carousel-arrow carousel-arrow-prev"
                aria-label="Previous image"
                onclick={goPrev}
            >
                <i class="fas fa-chevron-left"></i>
            </button>
        {/if}

        {#if canGoNext}
            <button
                class="carousel-arrow carousel-arrow-next"
                aria-label="Next image"
                onclick={goNext}
            >
                <i class="fas fa-chevron-right"></i>
            </button>
        {/if}

        <div class="carousel-dots">
            {#each imageUrls as _, i (i)}
                <button
                    class="carousel-dot"
                    class:active={i === current}
                    aria-label="Image {i + 1} of {count}"
                    onclick={(e) => { e.stopPropagation(); goTo(i); }}
                ></button>
            {/each}
        </div>

        <div class="carousel-counter">{current + 1}/{count}</div>
    {/if}
</div>

<style>
.carousel {
    position: relative;
    width: 100%;
    overflow: hidden;
    background-color: var(--color-bg-secondary, #fafafa);
    container-type: inline-size;
    touch-action: pan-y;
}

.carousel-track {
    display: flex;
    transition: transform var(--woof-duration-normal) var(--woof-ease-out);
}

.carousel-track.swiping {
    transition: none;
}

.carousel-slide {
    flex: 0 0 100%;
    min-width: 0;
}

.carousel-slide img {
    width: 100%;
    display: block;
    object-fit: cover;
    max-height: calc(100cqi * 1.25);
}

.carousel-dots {
    position: absolute;
    bottom: var(--woof-space-3);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: var(--woof-space-1);
    z-index: 1;
}

.carousel-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--woof-radius-full);
    border: none;
    padding: 0;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.5);
    transition: background var(--woof-duration-fast), transform var(--woof-duration-fast);
}

.carousel-dot.active {
    background: var(--woof-color-neutral-0);
    transform: scale(1.3);
}

/* Desktop navigation arrows — hidden on touch devices */
.carousel-arrow {
    display: none;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: var(--woof-btn-height-sm);
    height: var(--woof-btn-height-sm);
    border-radius: var(--woof-radius-full);
    border: none;
    background: var(--woof-surface-nav-blur);
    color: var(--woof-color-neutral-700);
    font-size: var(--woof-text-footnote);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--woof-duration-fast), background var(--woof-duration-fast);
    box-shadow: var(--woof-shadow-sm);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    align-items: center;
    justify-content: center;
}

.carousel-arrow-prev {
    left: var(--woof-space-3);
}

.carousel-arrow-next {
    right: var(--woof-space-3);
}

.carousel-arrow:hover {
    opacity: 1;
    background: var(--woof-color-neutral-0);
    box-shadow: var(--woof-shadow-md);
}

/* Only show arrows on devices that support hover (desktop) */
@media (hover: hover) and (pointer: fine) {
    .carousel-arrow {
        display: flex;
    }

    .carousel:hover .carousel-arrow {
        opacity: 0.8;
    }
}

.carousel-counter {
    position: absolute;
    top: var(--woof-space-3);
    right: var(--woof-space-3);
    background: rgba(0, 0, 0, 0.6);
    color: var(--woof-color-neutral-0);
    font-size: var(--woof-text-caption-1);
    padding: var(--woof-space-1) var(--woof-space-2);
    border-radius: var(--woof-radius-full);
    z-index: 1;
    pointer-events: none;
}
</style>
