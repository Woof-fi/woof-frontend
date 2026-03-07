<script>
    import { t } from '../../js/i18n-store.svelte.js';
    import { timeAgo } from '../../js/utils.js';

    let {
        createdAt = null,
        updatedAt = null,
        showFullDate = $bindable(false),
    } = $props();

    // svelte-ignore state_referenced_locally
    const createdDate = createdAt ? new Date(createdAt) : null;

    // svelte-ignore state_referenced_locally
    const isEdited = createdAt && updatedAt
        ? (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 60000
        : false;

    function formattedTimestamp() {
        if (!createdDate) return '';
        if (showFullDate) {
            return createdDate.toLocaleString(undefined, {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit'
            });
        }
        return timeAgo(createdAt);
    }
</script>

{#if createdDate}
    <div class="post-timestamp-container">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <time
            class="post-timestamp"
            datetime={createdDate.toISOString()}
            title={createdDate.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            style="cursor:pointer"
            onclick={() => showFullDate = !showFullDate}
        >{formattedTimestamp()}</time>
        {#if isEdited}
            <span class="post-edited-indicator">{t('post.edited')}</span>
        {/if}
    </div>
{/if}

<style>
.post-timestamp-container {
    padding: 0 10px 10px;
}

.post-timestamp {
    font-size: 10px;
    color: var(--woof-color-neutral-500);
    text-transform: uppercase;
    letter-spacing: 0.2px;
}

.post-edited-indicator {
    font-size: 10px;
    color: var(--woof-color-neutral-400);
    margin-left: var(--woof-space-1);
}
</style>
