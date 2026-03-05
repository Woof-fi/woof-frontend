<script>
    let { parks = [] } = $props();
</script>

<section class="nearby-parks">
    <h2 class="section-header">Dog Parks</h2>

    <div class="parks-grid">
        {#each parks as park (park.id)}
            <a href="/dog-park/{park.slug}" data-link class="park-card">
                <div class="park-card-top">
                    <i class="fas fa-tree park-icon" aria-hidden="true"></i>
                    <div class="park-name" title={park.name}>{park.name}</div>
                </div>

                <div class="park-card-bottom">
                    <span class="park-followers">
                        <i class="fas fa-users" aria-hidden="true"></i>
                        {park.followerCount}
                    </span>

                    {#if park.isFollowing}
                        <span class="following-badge">Following</span>
                    {/if}
                </div>
            </a>
        {/each}
    </div>
</section>

<style>
    .nearby-parks {
        width: 100%;
    }

    .section-header {
        font-size: var(--woof-text-headline);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-900);
        margin: var(--woof-space-6) 0 var(--woof-space-3) 0;
    }

    .parks-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--woof-space-3);
    }

    .park-card {
        background: var(--woof-surface-primary);
        border: 1px solid var(--woof-color-neutral-200);
        border-radius: var(--woof-radius-md);
        padding: var(--woof-space-3) var(--woof-space-4);
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
        gap: var(--woof-space-2);
        transition: box-shadow var(--woof-duration-fast) var(--woof-ease-default),
                    border-color var(--woof-duration-fast) var(--woof-ease-default);
    }

    .park-card:hover {
        box-shadow: var(--woof-shadow-sm);
        border-color: var(--woof-color-neutral-300);
    }

    .park-card-top {
        display: flex;
        align-items: flex-start;
        gap: var(--woof-space-2);
    }

    .park-icon {
        font-size: var(--woof-text-body);
        color: var(--woof-color-fresh-mint-dark);
        margin-top: 2px;
        flex-shrink: 0;
    }

    .park-name {
        font-size: var(--woof-text-footnote);
        font-weight: var(--woof-font-weight-medium);
        color: var(--woof-color-neutral-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.4;
    }

    .park-card-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--woof-space-2);
    }

    .park-followers {
        font-size: var(--woof-text-caption-1);
        color: var(--woof-color-neutral-400);
        display: flex;
        align-items: center;
        gap: var(--woof-space-1);
    }

    .park-followers i {
        font-size: var(--woof-text-caption-2);
    }

    .following-badge {
        font-size: var(--woof-text-caption-2);
        font-weight: var(--woof-font-weight-semibold);
        color: var(--woof-color-neutral-0);
        background: var(--woof-color-fresh-mint);
        padding: 2px var(--woof-space-2);
        border-radius: var(--woof-radius-full);
        line-height: 1.4;
        white-space: nowrap;
    }
</style>
